import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getMotorConfigsSync, MotorConfig } from '../../services/widgetConfig'
import { ChevronUp, ChevronDown, Square, Gauge } from 'lucide-react'

interface MotorUnitProps {
  motorConfig: MotorConfig
  entity: Entity | null
  api: any
  loading: boolean
  onLoadingChange: (loading: boolean) => void
}

const MotorUnit = ({ motorConfig, entity, api, loading, onLoadingChange }: MotorUnitProps) => {
  const [localLoading, setLocalLoading] = useState(false)
  const [position, setPosition] = useState<number | null>(null)

  useEffect(() => {
    if (entity) {
      const currentPosition = entity.attributes.current_position
      if (typeof currentPosition === 'number') {
        setPosition(currentPosition)
      } else {
        // Если позиция не доступна, определяем по state
        if (entity.state === 'open') {
          setPosition(100)
        } else if (entity.state === 'closed') {
          setPosition(0)
        } else {
          setPosition(null)
        }
      }
    }
  }, [entity])

  const handleOpen = async () => {
    if (!api || !motorConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'cover',
        service: 'open_cover',
        target: { entity_id: motorConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка открытия:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleClose = async () => {
    if (!api || !motorConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'cover',
        service: 'close_cover',
        target: { entity_id: motorConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка закрытия:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleStop = async () => {
    if (!api || !motorConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'cover',
        service: 'stop_cover',
        target: { entity_id: motorConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка остановки:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleSetPosition = async (newPosition: number) => {
    if (!api || !motorConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'cover',
        service: 'set_cover_position',
        target: { entity_id: motorConfig.entityId },
        service_data: { position: newPosition },
      })
      setPosition(newPosition)
    } catch (error) {
      console.error('Ошибка установки позиции:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const getStateDisplay = () => {
    if (!entity) return 'לא מחובר'
    const state = entity.state
    if (state === 'open') return 'פתוח'
    if (state === 'closed') return 'סגור'
    if (state === 'opening') return 'נפתח'
    if (state === 'closing') return 'נסגר'
    if (state === 'stopped') return 'עצר'
    return state
  }

  const getStateColor = () => {
    if (!entity) return 'text-gray-400'
    const state = entity.state
    if (state === 'open') return 'text-green-400'
    if (state === 'closed') return 'text-gray-400'
    if (state === 'opening' || state === 'closing') return 'text-yellow-400'
    if (state === 'stopped') return 'text-blue-400'
    return 'text-gray-400'
  }

  const displayName = motorConfig.name || (entity?.attributes.friendly_name || motorConfig.entityId || 'Мотор')

  return (
    <div className="p-2 bg-dark-bg rounded-lg border border-dark-border hover:border-blue-500 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="p-1 bg-blue-500/20 rounded flex-shrink-0">
            <Gauge size={12} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs text-white truncate" title={displayName}>
              {displayName}
            </div>
            <div className={`text-[10px] ${getStateColor()}`}>
              {getStateDisplay()}
            </div>
          </div>
        </div>
      </div>

      {/* Позиция в процентах */}
      {position !== null && (
        <div className="mb-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-dark-textSecondary">מיקום</span>
            <span className="text-xs font-bold text-white">{position}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={position}
            onChange={(e) => {
              const newPos = parseInt(e.target.value)
              setPosition(newPos)
            }}
            onMouseUp={(e) => {
              const newPos = parseInt((e.target as HTMLInputElement).value)
              handleSetPosition(newPos)
            }}
            onTouchEnd={(e) => {
              const newPos = parseInt((e.target as HTMLInputElement).value)
              handleSetPosition(newPos)
            }}
            disabled={localLoading || loading || !entity}
            className="w-full h-1.5 bg-dark-card rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${position}%, #1f2937 ${position}%, #1f2937 100%)`
            }}
          />
        </div>
      )}

      {/* Кнопки управления */}
      <div className="flex gap-1.5">
        <button
          onClick={handleOpen}
          disabled={localLoading || loading || !entity}
          className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
          title="פתוח"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={handleStop}
          disabled={localLoading || loading || !entity}
          className="px-2 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
          title="עצור"
        >
          <Square size={14} />
        </button>
        <button
          onClick={handleClose}
          disabled={localLoading || loading || !entity}
          className="flex-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center"
          title="סגור"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  )
}

const MotorWidget = () => {
  const [motorConfigs, setMotorConfigs] = useState<MotorConfig[]>([])
  const { api } = useHomeAssistant()
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfigs = () => {
      const configs = getMotorConfigsSync()
      console.log('MotorWidget: загружены конфигурации:', configs)
      setMotorConfigs(configs)
    }

    loadConfigs()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config') {
        console.log('MotorWidget: обнаружено изменение в localStorage')
        loadConfigs()
      }
    }

    const handleWidgetsChanged = () => {
      console.log('MotorWidget: получено событие widgets-changed')
      loadConfigs()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  useEffect(() => {
    if (motorConfigs.length > 0 && api) {
      loadEntities()
      // Обновляем состояния каждые 2 секунды
      const interval = setInterval(loadEntities, 2000)
      return () => clearInterval(interval)
    }
  }, [motorConfigs, api])

  const loadEntities = async () => {
    if (!api) return

    try {
      const allEntities = await api.getStates()
      const entityMap = new Map<string, Entity>()

      motorConfigs.forEach(config => {
        if (config.entityId) {
          const entity = allEntities.find(e => e.entity_id === config.entityId)
          if (entity) {
            entityMap.set(config.entityId, entity)
          }
        }
      })

      setEntities(entityMap)
    } catch (error) {
      console.error('Ошибка загрузки entities:', error)
    }
  }

  if (!Array.isArray(motorConfigs) || motorConfigs.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">Моторные устройства не настроены</div>
          <div className="text-xs text-dark-textSecondary">Настройте в Settings → Настройка виджетов</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
        <div className="p-1 bg-blue-500/20 rounded">
          <Gauge size={14} className="text-blue-400" />
        </div>
        <div className="font-medium text-sm text-white">מכשירים מוטוריים</div>
      </div>
      <div className="space-y-2">
        {motorConfigs.map((config, index) => (
          <MotorUnit
            key={index}
            motorConfig={config}
            entity={entities.get(config.entityId || '') || null}
            api={api}
            loading={loading}
            onLoadingChange={setLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default MotorWidget

