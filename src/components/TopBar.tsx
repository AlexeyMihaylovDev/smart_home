import { useState, useEffect } from 'react'
import { Home, Globe, Camera, Menu, Sparkles } from 'lucide-react'
import { getNavigationIconsSync, NavigationIcon } from '../services/widgetConfig'

interface TopBarProps {
  onMenuClick?: () => void
}

const iconMap = {
  camera: Camera,
  home: Home,
  network: Globe,
  vacuum: Sparkles,
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const [navigationIcons, setNavigationIcons] = useState<NavigationIcon[]>(() => {
    try {
      return getNavigationIconsSync()
    } catch {
      return []
    }
  })

  useEffect(() => {
    const handleIconsChange = () => {
      try {
        setNavigationIcons(getNavigationIconsSync())
      } catch (error) {
        console.error('Ошибка загрузки навигационных иконок:', error)
      }
    }

    window.addEventListener('navigation-icons-changed', handleIconsChange)
    return () => {
      window.removeEventListener('navigation-icons-changed', handleIconsChange)
    }
  }, [])

  const enabledIcons = navigationIcons
    .filter(icon => icon.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="h-14 sm:h-16 bg-dark-card border-b border-dark-border flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-3 md:gap-4">
      {/* Кнопка меню для мобильных */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-dark-textSecondary hover:bg-dark-cardHover hover:text-white transition-colors flex-shrink-0"
        title="Меню"
      >
        <Menu size={20} />
      </button>
      
      {/* Иконки - скрываем на очень маленьких экранах, показываем на планшетах и больше */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-3 md:gap-4 overflow-x-auto">
        {enabledIcons.map((icon) => {
          const IconComponent = iconMap[icon.iconName] || Home
          return (
            <button
              key={icon.id}
              className="p-2 rounded-lg text-dark-textSecondary hover:bg-dark-cardHover hover:text-white transition-colors flex-shrink-0"
              title={icon.label}
            >
              <IconComponent size={20} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TopBar


