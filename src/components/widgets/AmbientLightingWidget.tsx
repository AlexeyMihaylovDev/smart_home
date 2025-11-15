import { useState, useEffect } from 'react'
import { Clock, Lightbulb } from 'lucide-react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { getAmbientLightingConfigSync, getAmbientLightingStyleSync, LightConfig, AmbientLightingStyle } from '../../services/widgetConfig'
import { Entity } from '../../services/homeAssistantAPI'
import { ListStyle, CardsStyle, CompactStyle, MinimalStyle } from './AmbientLightingStyles'

const AmbientLightingWidget = () => {
  const { api } = useHomeAssistant()
  const [lights, setLights] = useState<LightConfig[]>([])
  const [style, setStyle] = useState<AmbientLightingStyle>('list')
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
    const widgetStyle = getAmbientLightingStyleSync()
    setLights(config)
    setStyle(widgetStyle)
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
    // Используем название из конфигурации (то, что пользователь ввел в настройках)
    return light.name || 'ללא שם'
  }

  const getIcon = (iconType: 'clock' | 'lightbulb') => {
    return iconType === 'clock' ? Clock : Lightbulb
  }

  if (loading) {
    return (
      <div className="h-full p-4">
        <div className="font-medium mb-4 text-white">תאורה סביבתית</div>
        <div className="text-sm text-dark-textSecondary">טוען...</div>
      </div>
    )
  }

  const styleProps = {
    lights,
    entities,
    onToggle: handleToggle,
    getEntityState,
    getDisplayName,
    getIcon
  }

  const renderStyle = () => {
    switch (style) {
      case 'cards':
        return <CardsStyle {...styleProps} />
      case 'compact':
        return <CompactStyle {...styleProps} />
      case 'minimal':
        return <MinimalStyle {...styleProps} />
      case 'list':
      default:
        return <ListStyle {...styleProps} />
    }
  }

  return (
    <div className="h-full p-2 sm:p-3 md:p-4 flex flex-col">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
        <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg">
          <Lightbulb size={16} className="sm:w-[18px] sm:h-[18px] text-yellow-400" />
        </div>
        <div className="font-medium text-sm sm:text-base text-white">תאורה סביבתית</div>
      </div>
      {renderStyle()}
    </div>
  )
}

export default AmbientLightingWidget



