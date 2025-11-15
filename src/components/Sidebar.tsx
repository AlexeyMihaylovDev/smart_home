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
  const { logout } = useAuth()

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


