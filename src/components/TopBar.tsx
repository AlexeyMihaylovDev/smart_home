import { Car, Home, Smile, Monitor, Shield, Globe, Camera, Folder, Menu } from 'lucide-react'

interface TopBarProps {
  onMenuClick?: () => void
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const icons = [
    { icon: Car, label: 'Garage' },
    { icon: Home, label: 'Home' },
    { icon: Smile, label: 'Rooms' },
    { icon: Monitor, label: 'Media' },
    { icon: Shield, label: 'Security' },
    { icon: Globe, label: 'Network' },
    { icon: Camera, label: 'Cameras' },
    { icon: Folder, label: 'Files' },
  ]

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
        {icons.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              className="p-2 rounded-lg text-dark-textSecondary hover:bg-dark-cardHover hover:text-white transition-colors flex-shrink-0"
              title={item.label}
            >
              <Icon size={20} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TopBar


