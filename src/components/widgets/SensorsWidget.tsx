import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getSensorsConfigSync, SensorConfig, getSensorsStyleSync, SensorsStyle } from '../../services/widgetConfig'
import {
  PreparedSensor,
  SensorsListStyle,
  SensorsCardStyle,
  SensorsCompactStyle,
  SensorsGridStyle,
  SensorsListNotConfigured,
  SensorsCardNotConfigured,
  SensorsCompactNotConfigured,
  SensorsGridNotConfigured,
} from './SensorsStyles'

const SensorsWidget = () => {
  const { api } = useHomeAssistant()
  const [sensors, setSensors] = useState<SensorConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [style, setStyle] = useState<SensorsStyle>('list')

  useEffect(() => {
    const loadConfig = () => {
      const config = getSensorsConfigSync()
      setSensors(config)
      const widgetStyle = getSensorsStyleSync()
      setStyle(widgetStyle)
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

  const preparedSensors: PreparedSensor[] = sensors.map((sensor, index) => ({
    id: sensor.entityId || `sensor-${index}`,
    name: getDisplayName(sensor),
    type: sensor.type,
    isActive: getEntityState(sensor.entityId),
    hasEntity: sensor.entityId !== null,
    powerType: sensor.powerType || 'electric',
    batteryLevel: sensor.powerType === 'battery' ? getBatteryLevel(sensor) : null,
  }))

  const renderStyle = () => {
    if (preparedSensors.length === 0) {
      switch (style) {
        case 'card':
          return <SensorsCardNotConfigured />
        case 'compact':
          return <SensorsCompactNotConfigured />
        case 'grid':
          return <SensorsGridNotConfigured />
        case 'list':
        default:
          return <SensorsListNotConfigured />
      }
    }

    const props = { sensors: preparedSensors }

    switch (style) {
      case 'card':
        return <SensorsCardStyle {...props} />
      case 'compact':
        return <SensorsCompactStyle {...props} />
      case 'grid':
        return <SensorsGridStyle {...props} />
      case 'list':
      default:
        return <SensorsListStyle {...props} />
    }
  }

  return (
    <div className="h-full p-4 overflow-y-auto">
      {renderStyle()}
    </div>
  )
}

export default SensorsWidget

