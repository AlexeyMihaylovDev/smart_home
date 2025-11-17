import { useState, useEffect } from 'react'
import { LayoutGrid, Settings, Zap, User, List, BarChart, Calendar, Play, Camera, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Page = 'dashboard' | 'settings'

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
  isMobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
}

const Sidebar = ({ currentPage, onPageChange, isMobileMenuOpen, onMobileMenuToggle }: SidebarProps) => {
  const { logout, user } = useAuth()
  const [showUserInfo, setShowUserInfo] = useState(false)

  const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', page: 'dashboard' as Page },
    { icon: Settings, label: 'Settings', page: 'settings' as Page },
    { icon: Zap, label: 'Energy' },
    { icon: User, label: 'Profile' },
    { icon: List, label: 'Devices' },
    { icon: BarChart, label: 'Analytics' },
    { icon: Calendar, label: 'Schedule' },
    { icon: Play, label: 'Scenes' },
  ]

  const bottomItems = [
    { icon: Camera, label: 'Cameras' },
    { icon: LogOut, label: 'Выход', action: 'logout' },
  ]

  const handleItemClick = (page?: Page) => {
    if (page) {
      onPageChange(page)
    }
    // Закрываем мобильное меню при клике на элемент
    if (onMobileMenuToggle && window.innerWidth < 1024) {
      onMobileMenuToggle()
    }
  }

  const handleLogout = () => {
    logout()
    if (onMobileMenuToggle) {
      onMobileMenuToggle()
    }
  }

  return (
    <>
      {/* Мобильное меню overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileMenuToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-16 
        bg-dark-card border-r border-dark-border 
        flex flex-col 
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Мобильный заголовок с кнопкой закрытия */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-white">Меню</h2>
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg text-dark-textSecondary hover:bg-dark-cardHover hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-2 lg:gap-4 py-4 px-2 lg:px-0 lg:items-center overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = item.page === currentPage
            return (
              <button
                key={index}
                onClick={() => handleItemClick(item.page)}
                className={`
                  w-full lg:w-auto
                  flex items-center gap-3 lg:justify-center
                  p-3 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-dark-cardHover text-white'
                    : 'text-dark-textSecondary hover:bg-dark-cardHover hover:text-white'
                  }
                `}
                title={item.label}
              >
                <Icon size={24} />
                <span className="lg:hidden text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2 lg:gap-4 px-2 lg:px-0 lg:items-center pb-4">
          {/* Отображение текущего пользователя */}
          {user && (
            <button
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="w-full lg:w-auto flex items-center gap-3 lg:justify-center p-3 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-colors cursor-pointer relative group"
              title={showUserInfo ? 'Скрыть информацию' : 'Показать информацию о пользователе'}
            >
              <div className="flex items-center gap-2 lg:justify-center">
                <User size={20} className="text-blue-400" />
                {/* На мобильных всегда показываем имя */}
                <div className="lg:hidden flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-300 truncate max-w-[140px]">
                    {user.username}
                  </span>
                  <span className="text-xs text-blue-400/70">({user.id})</span>
                </div>
                {/* На десктопе показываем имя при клике */}
                {showUserInfo && (
                  <div className="hidden lg:flex flex-col items-center">
                    <span className="text-sm font-medium text-blue-300 whitespace-nowrap">
                      {user.username}
                    </span>
                    <span className="text-xs text-blue-400/70">ID: {user.id}</span>
                  </div>
                )}
              </div>
              
              {/* Tooltip для десктопа при наведении (когда имя скрыто) */}
              {!showUserInfo && (
                <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-dark-card border border-dark-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  <div className="text-sm text-white font-medium">{user.username}</div>
                  <div className="text-xs text-dark-textSecondary">ID: {user.id}</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-border"></div>
                </div>
              )}
            </button>
          )}
          
          {bottomItems.map((item, index) => {
            const Icon = item.icon
            const isLogout = item.action === 'logout'
            return (
              <button
                key={index}
                onClick={() => {
                  if (isLogout) {
                    handleLogout()
                  } else {
                    handleItemClick()
                  }
                }}
                className="w-full lg:w-auto flex items-center gap-3 lg:justify-center p-3 rounded-lg text-dark-textSecondary hover:bg-dark-cardHover hover:text-white transition-colors"
                title={item.label}
              >
                <Icon size={24} />
                <span className="lg:hidden text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default Sidebar


