import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getSensorsConfig, SensorConfig } from '../../services/widgetConfig'
import { Activity, User, Gauge } from 'lucide-react'

const SensorsWidget = () => {
  const { api } = useHomeAssistant()
  const [sensors, setSensors] = useState<SensorConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())

  useEffect(() => {
    const loadConfig = () => {
      const config = getSensorsConfig()
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

      if (entityIds.length === 0) return

      const states = await Promise.all(
        entityIds.map(id => api.getState(id).catch(() => null))
      )

      const newEntities = new Map<string, Entity>()
      entityIds.forEach((id, index) => {
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
    return entity.state === 'on' || entity.state === 'active' || entity.state === 'detected'
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

  if (sensors.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">Датчики не настроены</div>
          <div className="text-xs text-dark-textSecondary">Настройте в Settings → Настройка виджетов</div>
        </div>
      </div>
    )
  }

  const motionSensors = sensors.filter(s => s.type === 'motion')
  const presenceSensors = sensors.filter(s => s.type === 'presence')

  return (
    <div className="h-full p-4 overflow-y-auto">
      {/* Датчики движения */}
      {motionSensors.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Activity size={16} className="text-blue-400" />
            </div>
            <div className="font-medium text-white text-sm">Датчики движения</div>
          </div>
          <div className="space-y-2">
            {motionSensors.map((sensor, index) => {
              const isActive = getEntityState(sensor.entityId)
              const hasEntity = sensor.entityId !== null
              const displayName = getDisplayName(sensor)

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-dark-border"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      isActive ? 'bg-blue-500/20' : 'bg-gray-500/20'
                    }`}>
                      <Activity
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
                      <span className="text-xs text-red-400 ml-2 flex-shrink-0">Не настроено</span>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isActive ? 'Активен' : 'Неактивен'}
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
              <User size={16} className="text-green-400" />
            </div>
            <div className="font-medium text-white text-sm">Датчики присутствия</div>
          </div>
          <div className="space-y-2">
            {presenceSensors.map((sensor, index) => {
              const isActive = getEntityState(sensor.entityId)
              const hasEntity = sensor.entityId !== null
              const displayName = getDisplayName(sensor)

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-dark-border"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      isActive ? 'bg-green-500/20' : 'bg-gray-500/20'
                    }`}>
                      <User
                        size={14}
                        className={isActive ? 'text-green-400' : 'text-gray-400'}
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
                      <span className="text-xs text-red-400 ml-2 flex-shrink-0">Не настроено</span>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                    isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isActive ? 'Присутствует' : 'Отсутствует'}
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

