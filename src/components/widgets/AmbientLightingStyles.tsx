import { Clock, Lightbulb } from 'lucide-react'
import { LightConfig } from '../../services/widgetConfig'
import { Entity } from '../../services/homeAssistantAPI'
import ToggleSwitch from '../ui/ToggleSwitch'

interface AmbientLightingStyleProps {
  lights: LightConfig[]
  entities: Map<string, Entity>
  onToggle: (light: LightConfig) => void
  getEntityState: (entityId: string | null) => boolean
  getDisplayName: (light: LightConfig) => string
  getIcon: (iconType: 'clock' | 'lightbulb') => typeof Clock | typeof Lightbulb
}

// Стиль 1: Список (текущий)
export const ListStyle = ({ lights, entities: _entities, onToggle, getEntityState, getDisplayName, getIcon }: AmbientLightingStyleProps) => {
  // Сортируем: включенные светильники сначала
  const sortedLights = [...lights].sort((a, b) => {
    const aOn = getEntityState(a.entityId)
    const bOn = getEntityState(b.entityId)
    if (aOn && !bOn) return -1
    if (!aOn && bOn) return 1
    return 0
  })

  return (
    <div className="space-y-2 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(5 * (2.5rem + 0.5rem))' }}>
      {Array.isArray(sortedLights) && sortedLights.map((light, index) => {
        const Icon = getIcon(light.icon)
        const isOn = getEntityState(light.entityId)
        const hasEntity = light.entityId !== null
        const displayName = getDisplayName(light)

        return (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Icon size={16} className={`${isOn ? 'text-yellow-400' : 'text-dark-textSecondary'} flex-shrink-0`} />
              <span className={`text-sm truncate ${isOn ? 'text-white' : 'text-dark-textSecondary'}`} title={displayName}>
                {displayName}
              </span>
              {!hasEntity && (
                <span className="text-xs text-red-400 ml-2 flex-shrink-0">לא מוגדר</span>
              )}
            </div>
            <ToggleSwitch
              checked={isOn}
              onChange={() => onToggle(light)}
              disabled={!hasEntity}
            />
          </div>
        )
      })}
    </div>
  )
}

// Стиль 2: Карточный (как на фото)
export const CardsStyle = ({ lights, entities, onToggle, getEntityState, getDisplayName, getIcon }: AmbientLightingStyleProps) => {
  // Сортируем: включенные светильники сначала
  const sortedLights = [...lights].sort((a, b) => {
    const aOn = getEntityState(a.entityId)
    const bOn = getEntityState(b.entityId)
    if (aOn && !bOn) return -1
    if (!aOn && bOn) return 1
    return 0
  })

  const getCardColor = (isOn: boolean, hasEntity: boolean) => {
    if (!hasEntity) return 'bg-gray-800/50 border-gray-700/50'
    if (isOn) {
      return 'bg-green-900/40 border-green-500/50'
    }
    return 'bg-gray-800/30 border-gray-700/30'
  }

  const getIconColor = (isOn: boolean, hasEntity: boolean) => {
    if (!hasEntity) return 'bg-gray-700/50'
    if (isOn) {
      return 'bg-green-600'
    }
    return 'bg-gray-600/50'
  }

  const getStatusText = (isOn: boolean, hasEntity: boolean, entityId: string | null) => {
    if (!hasEntity) return 'לא מוגדר'
    const entity = entityId ? entities.get(entityId) : null
    if (entity && entity.attributes.brightness !== undefined) {
      const brightness = Math.round((entity.attributes.brightness / 255) * 100)
      return `${brightness}%`
    }
    return isOn ? 'פועל' : 'כבוי'
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 min-h-0 p-1">
      {Array.isArray(sortedLights) && sortedLights.map((light, index) => {
        const Icon = getIcon(light.icon)
        const isOn = getEntityState(light.entityId)
        const hasEntity = light.entityId !== null
        const displayName = getDisplayName(light)
        const cardColor = getCardColor(isOn, hasEntity)
        const iconColor = getIconColor(isOn, hasEntity)
        const statusText = getStatusText(isOn, hasEntity, light.entityId)

        return (
          <div
            key={index}
            className={`rounded-lg border p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${cardColor} ${isOn ? 'shadow-green-500/20 shadow-lg' : ''}`}
            onClick={() => hasEntity && onToggle(light)}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconColor} transition-colors flex-shrink-0 ${isOn ? 'shadow-green-400/50 shadow-lg' : ''}`}>
                <Icon size={24} className={isOn ? 'text-white' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-h-0 w-full">
                <div className={`text-sm font-medium truncate ${isOn ? 'text-green-300' : 'text-gray-400'}`}>
                  {displayName}
                </div>
                <div className={`text-xs mt-1 ${isOn ? 'text-green-400/80' : 'text-gray-500'}`}>
                  {statusText}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Стиль 3: Компактный
export const CompactStyle = ({ lights, entities: _entities, onToggle, getEntityState, getDisplayName, getIcon }: AmbientLightingStyleProps) => {
  // Сортируем: включенные светильники сначала
  const sortedLights = [...lights].sort((a, b) => {
    const aOn = getEntityState(a.entityId)
    const bOn = getEntityState(b.entityId)
    if (aOn && !bOn) return -1
    if (!aOn && bOn) return 1
    return 0
  })

  return (
    <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
      {Array.isArray(sortedLights) && sortedLights.map((light, index) => {
        const Icon = getIcon(light.icon)
        const isOn = getEntityState(light.entityId)
        const hasEntity = light.entityId !== null
        const displayName = getDisplayName(light)

        return (
          <div
            key={index}
            className={`flex items-center justify-between p-1.5 rounded transition-colors flex-shrink-0 ${isOn ? 'bg-yellow-500/10' : 'hover:bg-white/5'
              }`}
            onClick={() => hasEntity && onToggle(light)}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Icon size={14} className={`${isOn ? 'text-yellow-400' : 'text-dark-textSecondary'} flex-shrink-0`} />
              <span className={`text-xs truncate ${isOn ? 'text-white' : 'text-dark-textSecondary'}`} title={displayName}>
                {displayName}
              </span>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOn ? 'bg-yellow-400' : 'bg-gray-600'}`} />
          </div>
        )
      })}
    </div>
  )
}

// Стиль 4: Минималистичный
export const MinimalStyle = ({ lights, entities: _entities, onToggle, getEntityState, getDisplayName, getIcon }: AmbientLightingStyleProps) => {
  // Сортируем: включенные светильники сначала
  const sortedLights = [...lights].sort((a, b) => {
    const aOn = getEntityState(a.entityId)
    const bOn = getEntityState(b.entityId)
    if (aOn && !bOn) return -1
    if (!aOn && bOn) return 1
    return 0
  })

  return (
    <div className="flex flex-wrap gap-2 overflow-y-auto flex-1 min-h-0 p-1">
      {Array.isArray(sortedLights) && sortedLights.map((light, index) => {
        const Icon = getIcon(light.icon)
        const isOn = getEntityState(light.entityId)
        const hasEntity = light.entityId !== null
        const displayName = getDisplayName(light)

        return (
          <div
            key={index}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all cursor-pointer ${isOn
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
              : 'bg-dark-card border-dark-border text-dark-textSecondary hover:border-dark-textSecondary'
              } ${!hasEntity ? 'opacity-50' : ''}`}
            onClick={() => hasEntity && onToggle(light)}
            title={displayName}
          >
            <Icon size={14} />
            <span className="text-xs truncate max-w-[100px]">{displayName}</span>
          </div>
        )
      })}
    </div>
  )
}

