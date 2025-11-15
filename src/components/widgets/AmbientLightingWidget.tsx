import { useState, useEffect } from 'react'
import { Clock, Lightbulb } from 'lucide-react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { getAmbientLightingConfigSync, LightConfig } from '../../services/widgetConfig'
import { Entity } from '../../services/homeAssistantAPI'
import ToggleSwitch from '../ui/ToggleSwitch'

const AmbientLightingWidget = () => {
  const { api } = useHomeAssistant()
  const [lights, setLights] = useState<LightConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()

    const handleWidgetsChanged = () => {
      console.log('AmbientLightingWidget: получено событие widgets-changed')
      loadConfig()
    }

    window.addEventListener('widgets-changed', handleWidgetsChanged)
    return () => {
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  useEffect(() => {
    if (lights.length > 0 && api) {
      loadEntities()
      // Обновляем состояния каждые 2 секунды
      const interval = setInterval(loadEntities, 2000)
      return () => clearInterval(interval)
    }
  }, [lights, api])

  const loadConfig = () => {
    const config = getAmbientLightingConfigSync()
    setLights(config)
    setLoading(false)
  }

  const loadEntities = async () => {
    if (!api) return

    try {
      const entityIds = lights
        .map(l => l.entityId)
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
      console.error('Ошибка загрузки состояний:', error)
    }
  }

  const handleToggle = async (light: LightConfig) => {
    if (!api || !light.entityId) return

    try {
      const entity = entities.get(light.entityId)
      if (!entity) return

      const isOn = entity.state === 'on'
      if (isOn) {
        await api.turnOff(light.entityId)
      } else {
        await api.turnOn(light.entityId)
      }

      // Обновляем состояние сразу
      loadEntities()
    } catch (error) {
      console.error('Ошибка переключения:', error)
    }
  }

  const getEntityState = (entityId: string | null): boolean => {
    if (!entityId) return false
    const entity = entities.get(entityId)
    if (!entity) return false
    return entity.state === 'on'
  }

  const getDisplayName = (light: LightConfig): string => {
    let name = light.name
    
    if (light.entityId) {
      const entity = entities.get(light.entityId)
      if (entity && entity.attributes.friendly_name) {
        name = entity.attributes.friendly_name
      }
    }
    
    // Убираем " Switch 1", " Switch 2" и т.д. из названия
    name = name.replace(/\s+Switch\s+\d+$/i, '')
    // Также убираем другие возможные суффиксы типа " switch_1", " switch_2"
    name = name.replace(/\s+switch[_\s]?\d+$/i, '')
    
    return name
  }

  const getIcon = (iconType: 'clock' | 'lightbulb') => {
    return iconType === 'clock' ? Clock : Lightbulb
  }

  if (loading) {
    return (
      <div className="h-full p-4">
        <div className="font-medium mb-4 text-white">Ambient Lighting</div>
        <div className="text-sm text-dark-textSecondary">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="h-full p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Lightbulb size={18} className="text-yellow-400" />
        </div>
        <div className="font-medium text-white">Ambient Lighting</div>
      </div>
      <div className="space-y-2">
        {Array.isArray(lights) && lights.map((light, index) => {
          const Icon = getIcon(light.icon)
          const isOn = getEntityState(light.entityId)
          const hasEntity = light.entityId !== null

          const displayName = getDisplayName(light)

          return (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon size={16} className={`${isOn ? 'text-yellow-400' : 'text-dark-textSecondary'} flex-shrink-0`} />
                <span className={`text-sm truncate ${isOn ? 'text-white' : 'text-dark-textSecondary'}`} title={displayName}>{displayName}</span>
                {!hasEntity && (
                  <span className="text-xs text-red-400 ml-2 flex-shrink-0">Не настроено</span>
                )}
              </div>
              <ToggleSwitch
                checked={isOn}
                onChange={() => handleToggle(light)}
                disabled={!hasEntity}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AmbientLightingWidget



