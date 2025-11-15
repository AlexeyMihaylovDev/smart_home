import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getSensorsConfigSync, SensorConfig } from '../../services/widgetConfig'
import { Radio, User, Gauge, Battery, BatteryLow, BatteryMedium, BatteryFull, Activity, Waves } from 'lucide-react'

const SensorsWidget = () => {
  const { api } = useHomeAssistant()
  const [sensors, setSensors] = useState<SensorConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())

  useEffect(() => {
    const loadConfig = () => {
      const config = getSensorsConfigSync()
      setSensors(config)
    }

    loadConfig()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config') {
        loadConfig()
      }
    }

    const handleWidgetsChanged = () => {
      loadConfig()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  useEffect(() => {
    if (sensors.length > 0 && api) {
      loadEntities()
      const interval = setInterval(loadEntities, 2000)
      return () => clearInterval(interval)
    }
  }, [sensors, api])

  const loadEntities = async () => {
    if (!api) return

    try {
      const entityIds = sensors
        .map(s => s.entityId)
        .filter((id): id is string => id !== null)
      
      const batteryEntityIds = sensors
        .filter(s => s.powerType === 'battery' && s.batteryEntityId)
        .map(s => s.batteryEntityId)
        .filter((id): id is string => id !== null)

      const allEntityIds = [...new Set([...entityIds, ...batteryEntityIds])]

      if (allEntityIds.length === 0) return

      const states = await Promise.all(
        allEntityIds.map(id => api.getState(id).catch(() => null))
      )

      const newEntities = new Map<string, Entity>()
      allEntityIds.forEach((id, index) => {
        const state = states[index]
        if (state) {
          newEntities.set(id, state)
        }
      })

      setEntities(newEntities)
    } catch (error) {
      console.error('Ошибка загрузки состояний датчиков:', error)
    }
  }

  const getEntityState = (entityId: string | null): boolean => {
    if (!entityId) return false
    const entity = entities.get(entityId)
    if (!entity) return false
    return entity.state === 'on' || entity.state === 'active' || entity.state === 'detected' || entity.state === 'home'
  }

  const getDisplayName = (sensor: SensorConfig): string => {
    if (sensor.name) return sensor.name
    if (sensor.entityId) {
      const entity = entities.get(sensor.entityId)
      if (entity?.attributes.friendly_name) {
        return entity.attributes.friendly_name
      }
      return sensor.entityId.split('.')[1] || sensor.entityId
    }
    return 'Неизвестный датчик'
  }

  const getBatteryLevel = (sensor: SensorConfig): number | null => {
    // Если есть отдельный entity ID для батареи, используем его
    if (sensor.powerType === 'battery' && sensor.batteryEntityId) {
      const batteryEntity = entities.get(sensor.batteryEntityId)
      if (batteryEntity) {
        const attrs = batteryEntity.attributes || {}
        
        // Пробуем разные варианты получения значения батареи
        let battery: number | null = null
        
        // Проверяем атрибуты
        if (attrs.battery_level !== undefined) {
          battery = typeof attrs.battery_level === 'number' ? attrs.battery_level : parseFloat(String(attrs.battery_level))
        } else if (attrs.battery !== undefined) {
          battery = typeof attrs.battery === 'number' ? attrs.battery : parseFloat(String(attrs.battery))
        } else if (attrs.battery_percentage !== undefined) {
          battery = typeof attrs.battery_percentage === 'number' ? attrs.battery_percentage : parseFloat(String(attrs.battery_percentage))
        }
        
        // Если в атрибутах не нашли, проверяем state
        if (battery === null || isNaN(battery)) {
          const stateValue = batteryEntity.state
          if (stateValue !== undefined && stateValue !== null && stateValue !== 'unknown' && stateValue !== 'unavailable') {
            battery = typeof stateValue === 'number' ? stateValue : parseFloat(String(stateValue))
          }
        }
        
        if (battery !== null && !isNaN(battery)) {
          return Math.max(0, Math.min(100, battery))
        }
      }
    }
    
    // Fallback: проверяем атрибуты основного entity
    if (!sensor.entityId) return null
    const entity = entities.get(sensor.entityId)
    if (!entity) return null
    
    const attrs = entity.attributes || {}
    let battery: number | null = null
    
    if (attrs.battery_level !== undefined) {
      battery = typeof attrs.battery_level === 'number' ? attrs.battery_level : parseFloat(String(attrs.battery_level))
    } else if (attrs.battery !== undefined) {
      battery = typeof attrs.battery === 'number' ? attrs.battery : parseFloat(String(attrs.battery))
    } else if (attrs.battery_percentage !== undefined) {
      battery = typeof attrs.battery_percentage === 'number' ? attrs.battery_percentage : parseFloat(String(attrs.battery_percentage))
    }
    
    if (battery !== null && !isNaN(battery)) {
      return Math.max(0, Math.min(100, battery))
    }
    
    return null
  }

  const getBatteryIcon = (level: number | null) => {
    if (level === null) return null
    
    if (level <= 20) return BatteryLow
    if (level <= 40) return BatteryMedium
    if (level <= 60) return BatteryMedium
    return BatteryFull
  }

  const getBatteryColor = (level: number | null): string => {
    if (level === null) return 'text-gray-500'
    if (level <= 20) return 'text-red-400'
    if (level <= 40) return 'text-yellow-400'
    return 'text-green-400'
  }

  if (!Array.isArray(sensors) || sensors.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">Датчики не настроены</div>
          <div className="text-xs text-dark-textSecondary">Настройте в Settings → Настройка виджетов</div>
        </div>
      </div>
    )
  }

  const motionSensors = Array.isArray(sensors) ? sensors.filter(s => s.type === 'motion') : []
  const presenceSensors = Array.isArray(sensors) ? sensors.filter(s => s.type === 'presence') : []

  return (
    <div className="h-full p-4 overflow-y-auto">
      {/* Датчики движения */}
      {motionSensors.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Radio size={16} className="text-blue-400" />
            </div>
            <div className="font-medium text-white text-sm">Датчики движения</div>
          </div>
          <div className="space-y-2">
            {motionSensors.map((sensor, index) => {
              const isActive = getEntityState(sensor.entityId)
              const hasEntity = sensor.entityId !== null
              const displayName = getDisplayName(sensor)
              const powerType = sensor.powerType || 'electric'
              const batteryLevel = powerType === 'battery' ? getBatteryLevel(sensor) : null
              const BatteryIcon = batteryLevel !== null ? getBatteryIcon(batteryLevel) : null
              const batteryColor = getBatteryColor(batteryLevel)

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-dark-border"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      isActive ? 'bg-blue-500/20' : 'bg-gray-500/20'
                    }`}>
                      <Radio
                        size={14}
                        className={isActive ? 'text-blue-400' : 'text-gray-400'}
                      />
                    </div>
                    <span
                      className={`text-sm truncate ${
                        isActive ? 'text-white font-medium' : 'text-dark-textSecondary'
                      }`}
                      title={displayName}
                    >
                      {displayName}
                    </span>
                    {!hasEntity && (
                      <span className="text-xs text-red-400 ml-2 flex-shrink-0">לא מוגדר</span>
                    )}
                    {powerType === 'electric' && (
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0 px-2 py-0.5 rounded-full bg-dark-card border border-dark-border text-green-400" title="חשמל">
                        <span className="text-xs font-medium">∞</span>
                      </div>
                    )}
                    {powerType === 'battery' && (
                      batteryLevel !== null && BatteryIcon ? (
                        <div className={`flex items-center gap-1 ml-2 flex-shrink-0 px-2 py-0.5 rounded-full bg-dark-card border border-dark-border ${batteryColor}`} title={`סוללה: ${batteryLevel}%`}>
                          <BatteryIcon size={12} />
                          <span className="text-xs font-medium">{batteryLevel}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0 px-2 py-0.5 rounded-full bg-dark-card border border-dark-border text-gray-400" title="סוללה: אין נתונים">
                          <Battery size={12} />
                          <span className="text-xs font-medium">--</span>
                        </div>
                      )
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isActive ? 'פעיל' : 'לא פעיל'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Датчики присутствия */}
      {presenceSensors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-green-500/20 rounded-lg">
              <Waves size={16} className="text-green-400" />
            </div>
            <div className="font-medium text-white text-sm">חיישני נוכחות</div>
          </div>
          <div className="space-y-2">
            {presenceSensors.map((sensor, index) => {
              const isActive = getEntityState(sensor.entityId)
              const hasEntity = sensor.entityId !== null
              const displayName = getDisplayName(sensor)
              const powerType = sensor.powerType || 'electric'
              const batteryLevel = powerType === 'battery' ? getBatteryLevel(sensor) : null
              const BatteryIcon = batteryLevel !== null ? getBatteryIcon(batteryLevel) : null
              const batteryColor = getBatteryColor(batteryLevel)

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-dark-border"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      isActive ? 'bg-green-500/20' : 'bg-gray-500/20'
                    }`}>
                      {isActive ? (
                        <Activity
                          size={14}
                          className="text-green-400"
                        />
                      ) : (
                        <User
                          size={14}
                          className="text-gray-400"
                        />
                      )}
                    </div>
                    <span
                      className={`text-sm truncate ${
                        isActive ? 'text-white font-medium' : 'text-dark-textSecondary'
                      }`}
                      title={displayName}
                    >
                      {displayName}
                    </span>
                    {!hasEntity && (
                      <span className="text-xs text-red-400 ml-2 flex-shrink-0">לא מוגדר</span>
                    )}
                    {powerType === 'electric' && (
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0 px-2 py-0.5 rounded-full bg-dark-card border border-dark-border text-green-400" title="חשמל">
                        <span className="text-xs font-medium">∞</span>
                      </div>
                    )}
                    {powerType === 'battery' && (
                      batteryLevel !== null && BatteryIcon ? (
                        <div className={`flex items-center gap-1 ml-2 flex-shrink-0 px-2 py-0.5 rounded-full bg-dark-card border border-dark-border ${batteryColor}`} title={`סוללה: ${batteryLevel}%`}>
                          <BatteryIcon size={12} />
                          <span className="text-xs font-medium">{batteryLevel}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0 px-2 py-0.5 rounded-full bg-dark-card border border-dark-border text-gray-400" title="סוללה: אין נתונים">
                          <Battery size={12} />
                          <span className="text-xs font-medium">--</span>
                        </div>
                      )
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                    isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isActive ? 'נוכח' : 'נעדר'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SensorsWidget

