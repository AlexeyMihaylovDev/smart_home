import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getVacuumConfigsSync, VacuumConfig } from '../../services/widgetConfig'
import { 
  Play, Pause, Square, Home, Battery, Map as MapIcon, 
  Clock, Settings, ChevronDown, ChevronUp, 
  RefreshCw, Navigation, Zap
} from 'lucide-react'

interface VacuumUnitProps {
  vacuumConfig: VacuumConfig
  entity: Entity | null
  mapEntity: Entity | null
  api: any
  loading: boolean
  onLoadingChange: (loading: boolean) => void
}

const VacuumUnit = ({ vacuumConfig, entity, mapEntity, api, loading, onLoadingChange }: VacuumUnitProps) => {
  const [localLoading, setLocalLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mapImage, setMapImage] = useState<string | null>(null)

  useEffect(() => {
    // Загружаем карту из map entity или из основного entity
    if (mapEntity) {
      // Пробуем разные атрибуты для карты
      const mapUrl = mapEntity.attributes.map_image || 
                     mapEntity.attributes.entity_picture || 
                     mapEntity.attributes.image ||
                     (mapEntity.state && mapEntity.state !== 'unknown' && mapEntity.state !== 'unavailable' ? `http://${window.location.hostname}:8123/api/camera_proxy/${mapEntity.entity_id}` : null)
      
      if (mapUrl) {
        const fullUrl = mapUrl.startsWith('http') 
          ? mapUrl 
          : `http://${window.location.hostname}:8123${mapUrl}`
        setMapImage(fullUrl)
      } else if (mapEntity.entity_id.startsWith('camera.') || mapEntity.entity_id.startsWith('image.')) {
        // Для camera/image entities используем proxy
        const fullUrl = `http://${window.location.hostname}:8123/api/camera_proxy/${mapEntity.entity_id}`
        setMapImage(fullUrl)
      }
    } else if (entity) {
      const mapUrl = entity.attributes.map_image || 
                     entity.attributes.entity_picture || 
                     entity.attributes.image
      if (mapUrl) {
        const fullUrl = mapUrl.startsWith('http') 
          ? mapUrl 
          : `http://${window.location.hostname}:8123${mapUrl}`
        setMapImage(fullUrl)
      }
    } else {
      setMapImage(null)
    }
  }, [entity, mapEntity])

  const state = entity?.state || 'unknown'
  const isCleaning = state === 'cleaning'
  const isPaused = state === 'paused'
  const isDocked = state === 'docked' || state === 'idle'
  const isReturning = state === 'returning'
  const batteryLevel = entity?.attributes.battery_level || entity?.attributes.battery || 0
  const status = entity?.attributes.status || state
  const fanSpeed = entity?.attributes.fan_speed || entity?.attributes.fan_speed_list?.[0] || 'Auto'
  const fanSpeedList = entity?.attributes.fan_speed_list || []
  const currentRoom = entity?.attributes.current_room
  const friendlyName = vacuumConfig.name || entity?.attributes.friendly_name || vacuumConfig.entityId || 'Vacuum'

  const handleStart = async () => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'start',
        target: { entity_id: vacuumConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка запуска пылесоса:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handlePause = async () => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'pause',
        target: { entity_id: vacuumConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка паузы пылесоса:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleStop = async () => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'stop',
        target: { entity_id: vacuumConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка остановки пылесоса:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleReturnToBase = async () => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'return_to_base',
        target: { entity_id: vacuumConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка возврата на базу:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleSetFanSpeed = async (speed: string) => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'set_fan_speed',
        target: { entity_id: vacuumConfig.entityId },
        service_data: { fan_speed: speed }
      })
    } catch (error) {
      console.error('Ошибка установки скорости вентилятора:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleCleanRoom = async (roomId: string | number) => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'clean_spot',
        target: { entity_id: vacuumConfig.entityId },
        service_data: { room: roomId }
      })
    } catch (error) {
      // Пробуем альтернативный сервис
      try {
        await api.callService({
          domain: 'vacuum',
          service: 'send_command',
          target: { entity_id: vacuumConfig.entityId },
          service_data: { 
            command: 'app_segment_clean',
            params: [roomId]
          }
        })
      } catch (error2) {
        console.error('Ошибка уборки комнаты:', error2)
      }
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const getRooms = (): Array<{ id: string | number, name: string }> => {
    if (!entity) return []
    const rooms = entity.attributes.rooms || entity.attributes.room_list || []
    if (Array.isArray(rooms)) {
      return rooms.map((room: any) => ({
        id: room.id || room.segment_id || room,
        name: room.name || room.label || `Room ${room.id || room}`
      }))
    }
    return []
  }

  const rooms = getRooms()

  const getBatteryColor = (level: number): string => {
    if (level > 50) return 'text-green-400'
    if (level > 20) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBatteryIcon = (level: number) => {
    if (level > 75) return Battery
    if (level > 50) return Battery
    if (level > 25) return Battery
    return Battery
  }

  const BatteryIcon = getBatteryIcon(batteryLevel)

  if (!entity) {
    return (
      <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
        <div className="text-center text-dark-textSecondary">
          <div className="text-sm mb-1">{friendlyName}</div>
          <div className="text-xs">לא מחובר</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-blue-500/50 transition-all overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
            isCleaning ? 'bg-green-500/20' : 
            isPaused ? 'bg-yellow-500/20' : 
            isDocked ? 'bg-blue-500/20' : 
            'bg-gray-500/20'
          }`}>
            <Navigation size={16} className={`sm:w-[18px] sm:h-[18px] ${
              isCleaning ? 'text-green-400' : 
              isPaused ? 'text-yellow-400' : 
              isDocked ? 'text-blue-400' : 
              'text-gray-400'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm sm:text-base text-white truncate" title={friendlyName}>
              {friendlyName}
            </div>
            <div className="text-[10px] sm:text-xs text-dark-textSecondary truncate">
              {status}
            </div>
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-dark-card border border-dark-border flex-shrink-0 ${getBatteryColor(batteryLevel)}`}>
            <BatteryIcon size={12} />
            <span className="text-[10px] font-medium">{batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Карта дома */}
      {mapImage && (
        <div className="mb-2 sm:mb-3 rounded-lg overflow-hidden border border-dark-border bg-dark-card">
          <div className="relative w-full" style={{ aspectRatio: '1', minHeight: '150px', maxHeight: '300px' }}>
            <img 
              src={mapImage}
              alt="Map"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            {currentRoom && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600/80 backdrop-blur-sm rounded text-xs text-white">
                {currentRoom}
              </div>
            )}
            {isCleaning && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-green-600/80 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1">
                <Zap size={10} />
                מנקה
              </div>
            )}
          </div>
        </div>
      )}

      {/* Основные кнопки управления */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        {!isCleaning && !isPaused && (
          <button
            onClick={handleStart}
            disabled={localLoading || loading || isReturning}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="התחל ניקוי"
          >
            <Play size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">התחל</span>
          </button>
        )}
        {isCleaning && (
          <button
            onClick={handlePause}
            disabled={localLoading || loading}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="השהה"
          >
            <Pause size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">השהה</span>
          </button>
        )}
        {isPaused && (
          <button
            onClick={handleStart}
            disabled={localLoading || loading}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="המשך"
          >
            <Play size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">המשך</span>
          </button>
        )}
        {(isCleaning || isPaused) && (
          <button
            onClick={handleStop}
            disabled={localLoading || loading}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="עצור"
          >
            <Square size={16} className="sm:w-5 sm:h-5" />
          </button>
        )}
        {!isDocked && (
          <button
            onClick={handleReturnToBase}
            disabled={localLoading || loading || isReturning}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="חזור לבסיס"
          >
            <Home size={16} className="sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Скорость вентилятора */}
      {fanSpeedList.length > 0 && (
        <div className="mb-2 sm:mb-3">
          <div className="text-[10px] sm:text-xs text-dark-textSecondary mb-1.5">מהירות מפוח</div>
          <div className="flex flex-wrap gap-1.5">
            {fanSpeedList.map((speed: string) => (
              <button
                key={speed}
                onClick={() => handleSetFanSpeed(speed)}
                disabled={localLoading || loading}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  fanSpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-card hover:bg-dark-cardHover text-dark-textSecondary'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Комнаты */}
      {rooms.length > 0 && (
        <div className="mb-2 sm:mb-3">
          <div className="text-[10px] sm:text-xs text-dark-textSecondary mb-1.5">ניקוי חדרים</div>
          <div className="flex flex-wrap gap-1.5 max-h-24 sm:max-h-32 overflow-y-auto">
            {rooms.slice(0, 8).map((room) => (
              <button
                key={room.id}
                onClick={() => handleCleanRoom(room.id)}
                disabled={localLoading || loading}
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-dark-card hover:bg-dark-cardHover text-dark-textSecondary hover:text-white"
                title={`נקה ${room.name}`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Расширенные настройки */}
      <div className="border-t border-dark-border pt-2 mt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-[10px] sm:text-xs text-dark-textSecondary hover:text-white transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Settings size={12} />
            <span>הגדרות מתקדמות</span>
          </div>
          <ChevronDown 
            size={12} 
            className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {showAdvanced && (
          <div className="mt-2 space-y-2 pt-2 border-t border-dark-border">
            {/* Дополнительная информация */}
            <div className="space-y-1 text-[10px] text-dark-textSecondary">
              {entity.attributes.cleaned_area !== undefined && (
                <div className="flex justify-between">
                  <span>שטח נקי:</span>
                  <span className="text-white">{entity.attributes.cleaned_area} m²</span>
                </div>
              )}
              {entity.attributes.cleaning_time !== undefined && (
                <div className="flex justify-between">
                  <span>זמן ניקוי:</span>
                  <span className="text-white">{entity.attributes.cleaning_time}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const VacuumWidget = () => {
  const [vacuumConfigs, setVacuumConfigs] = useState<VacuumConfig[]>([])
  const { api } = useHomeAssistant()
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [mapEntities, setMapEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfig = () => {
      try {
        const config = getVacuumConfigsSync()
        setVacuumConfigs(Array.isArray(config) ? config : [])
      } catch (error) {
        console.error('Ошибка загрузки конфигурации пылесоса:', error)
        setVacuumConfigs([])
      }
    }

    loadConfig()

    const handleWidgetsChanged = () => {
      loadConfig()
    }

    window.addEventListener('widgets-changed', handleWidgetsChanged)
    return () => {
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  useEffect(() => {
    if (api && vacuumConfigs.length > 0) {
      loadEntities()
      const interval = setInterval(loadEntities, 3000)
      return () => clearInterval(interval)
    }
  }, [api, vacuumConfigs])

  const loadEntities = async () => {
    if (!api || vacuumConfigs.length === 0) return

    try {
      const entityIds = vacuumConfigs
        .map(v => v.entityId)
        .filter((id): id is string => id !== null)

      const mapEntityIds = vacuumConfigs
        .map(v => v.mapEntityId)
        .filter((id): id is string => id !== null)

      // Добавляем все связанные entities из конфигурации
      const relatedEntityIds = vacuumConfigs
        .flatMap(v => v.relatedEntities || [])
        .map(re => typeof re === 'string' ? re : re.entityId)
        .filter((id): id is string => id !== null && id !== undefined)

      const allEntityIds = [...new Set([...entityIds, ...mapEntityIds, ...relatedEntityIds])]

      if (allEntityIds.length === 0) return

      const states = await Promise.all(
        allEntityIds.map(id => api.getState(id).catch(() => null))
      )

      const newEntities = new Map<string, Entity>()
      const newMapEntities = new Map<string, Entity>()

      entityIds.forEach((id) => {
        const state = states[allEntityIds.indexOf(id)]
        if (state) {
          newEntities.set(id, state)
        }
      })

      mapEntityIds.forEach((id) => {
        const state = states[allEntityIds.indexOf(id)]
        if (state) {
          newMapEntities.set(id, state)
        }
      })

      // Загружаем также все связанные entities (для будущего использования)
      relatedEntityIds.forEach((id) => {
        const state = states[allEntityIds.indexOf(id)]
        if (state) {
          // Если это map entity, добавляем в mapEntities
          if (id.includes('map') || id.includes('mappin') || 
              id.startsWith('camera.') || id.startsWith('image.')) {
            newMapEntities.set(id, state)
          }
          // Остальные связанные entities можно использовать для расширенной функциональности
        }
      })

      setEntities(newEntities)
      setMapEntities(newMapEntities)
    } catch (error) {
      console.error('Ошибка загрузки состояний пылесосов:', error)
    }
  }

  if (vacuumConfigs.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">שואב אבק לא מוגדר</div>
          <div className="text-xs text-dark-textSecondary">הגדר בהגדרות ← הגדרת ווידג'טים</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-2 sm:p-3 md:p-4 overflow-y-auto">
      <div className={`grid gap-3 sm:gap-4 ${
        vacuumConfigs.length === 1 
          ? 'grid-cols-1' 
          : vacuumConfigs.length === 2 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {Array.isArray(vacuumConfigs) && vacuumConfigs.map((vacuumConfig, index) => (
          <VacuumUnit
            key={vacuumConfig.entityId || index}
            vacuumConfig={vacuumConfig}
            entity={vacuumConfig.entityId ? entities.get(vacuumConfig.entityId) || null : null}
            mapEntity={vacuumConfig.mapEntityId ? mapEntities.get(vacuumConfig.mapEntityId) || null : null}
            api={api}
            loading={loading}
            onLoadingChange={setLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default VacuumWidget

