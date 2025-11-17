import { useState, useEffect } from 'react'
import { Home, Globe, Camera, Menu, Sparkles, Lightbulb, Tv, Music } from 'lucide-react'
import { getNavigationIconsSync, getNavigationIcons, NavigationIcon } from '../services/widgetConfig'
import { isWidgetEnabledSync } from '../services/widgetConfig'

interface TopBarProps {
  onMenuClick?: () => void
  onTabChange?: (tabId: string) => void
  currentTab?: string
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  camera: Camera,
  home: Home,
  network: Globe,
  vacuum: Sparkles,
  'ambient-lighting': Lightbulb,
  'tv-time': Tv,
  'media-player': Tv,
  'spotify': Music,
}

const TopBar = ({ onMenuClick, onTabChange, currentTab }: TopBarProps) => {
  const [navigationIcons, setNavigationIcons] = useState<NavigationIcon[]>(() => {
    try {
      return getNavigationIconsSync()
    } catch {
      return []
    }
  })

  // Загружаем navigation icons с сервера при монтировании
  useEffect(() => {
    const loadIconsFromServer = async () => {
      try {
        console.log('[TopBar] Загрузка navigation icons с сервера при монтировании...')
        await getNavigationIcons()
        console.log('[TopBar] Navigation icons загружены с сервера, обновляем локальное состояние')
        // После загрузки обновляем локальное состояние
        setNavigationIcons(getNavigationIconsSync())
      } catch (error) {
        console.error('[TopBar] Ошибка загрузки navigation icons с сервера:', error)
        // В случае ошибки все равно загружаем из кэша/localStorage
        try {
          setNavigationIcons(getNavigationIconsSync())
        } catch (e) {
          console.error('[TopBar] Ошибка загрузки из кэша:', e)
        }
      }
    }
    loadIconsFromServer()
  }, []) // Загружаем только один раз при монтировании

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

  const handleTabClick = (icon: NavigationIcon) => {
    if (onTabChange) {
      // Используем dashboardId, если есть, иначе widgetId или iconName
      const tabId = icon.dashboardId || icon.widgetId || icon.iconName
      onTabChange(tabId)
    }
  }

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
          // Для виджетов получаем иконку из widgetType
          let IconComponent = iconMap[icon.iconName] || Home
          if (icon.iconName === 'widget' && icon.widgetType) {
            IconComponent = iconMap[icon.widgetType] || Home
          }
          
          const tabId = icon.dashboardId || icon.widgetId || icon.iconName
          const isActive = currentTab === tabId
          
          return (
            <button
              key={icon.id}
              onClick={() => handleTabClick(icon)}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-dark-textSecondary hover:bg-dark-cardHover hover:text-white'
              }`}
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


