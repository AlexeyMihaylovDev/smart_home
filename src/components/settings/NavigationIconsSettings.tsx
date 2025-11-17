import { useState, useEffect } from 'react'
import { GripVertical, Home, Globe, Camera, Sparkles } from 'lucide-react'
import { NavigationIcon, getNavigationIconsSync, updateNavigationIcons } from '../../services/widgetConfig'
import ToggleSwitch from '../ui/ToggleSwitch'

interface NavigationIconsSettingsProps {
  onIconsChange?: () => void
}

const NavigationIconsSettings = ({ onIconsChange }: NavigationIconsSettingsProps) => {
  const [navigationIcons, setNavigationIcons] = useState<NavigationIcon[]>(() => {
    try {
      return getNavigationIconsSync()
    } catch {
      return []
    }
  })
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null)

  useEffect(() => {
    const handleIconsChange = () => {
      try {
        setNavigationIcons(getNavigationIconsSync())
      } catch (error) {
        console.error('Ошибка обновления навигационных иконок:', error)
      }
    }
    window.addEventListener('navigation-icons-changed', handleIconsChange)
    return () => {
      window.removeEventListener('navigation-icons-changed', handleIconsChange)
    }
  }, [])

  const iconMap = {
    camera: Camera,
    home: Home,
    network: Globe,
    vacuum: Sparkles,
  }

  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-6">
      <h2 className="text-xl font-bold mb-4">Группировка навигационных иконок</h2>
      <p className="text-sm text-dark-textSecondary mb-6">
        Перетащите иконки для изменения порядка. Включите/выключите иконки для отображения в навигации.
      </p>
      <div className="space-y-2">
        {navigationIcons
          .sort((a, b) => a.order - b.order)
          .map((icon) => {
            const IconComponent = iconMap[icon.iconName] || Home
            
            return (
              <div
                key={icon.id}
                draggable
                onDragStart={(e) => {
                  setDraggedIcon(icon.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedIcon && draggedIcon !== icon.id) {
                    const draggedIndex = navigationIcons.findIndex(i => i.id === draggedIcon)
                    const targetIndex = navigationIcons.findIndex(i => i.id === icon.id)
                    const newIcons = [...navigationIcons]
                    const [removed] = newIcons.splice(draggedIndex, 1)
                    newIcons.splice(targetIndex, 0, removed)
                    const updatedIcons = newIcons.map((ic, idx) => ({ ...ic, order: idx }))
                    setNavigationIcons(updatedIcons)
                    updateNavigationIcons(updatedIcons)
                    setDraggedIcon(null)
                    onIconsChange?.()
                  }
                }}
                onDragEnd={() => setDraggedIcon(null)}
                className={`flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-lg transition-all ${
                  draggedIcon === icon.id ? 'opacity-50' : 'hover:border-blue-500'
                }`}
              >
                <GripVertical size={20} className="text-dark-textSecondary cursor-move" />
                <IconComponent size={20} className="text-dark-textSecondary" />
                <span className="flex-1 text-sm font-medium">{icon.label}</span>
                <ToggleSwitch
                  checked={icon.enabled}
                  onChange={async () => {
                    const updatedIcons = navigationIcons.map(i =>
                      i.id === icon.id ? { ...i, enabled: !i.enabled } : i
                    )
                    setNavigationIcons(updatedIcons)
                    await updateNavigationIcons(updatedIcons)
                    window.dispatchEvent(new Event('navigation-icons-changed'))
                    onIconsChange?.()
                  }}
                />
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default NavigationIconsSettings

