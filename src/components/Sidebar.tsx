import { LayoutGrid, Settings, Zap, User, List, BarChart, Calendar, Play, Camera, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Page = 'dashboard' | 'settings'

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

const Sidebar = ({ currentPage, onPageChange }: SidebarProps) => {
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

  return (
    <div className="w-16 bg-dark-card border-r border-dark-border flex flex-col items-center py-4">
      <div className="flex-1 flex flex-col gap-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = item.page === currentPage
          return (
            <button
              key={index}
              onClick={() => item.page && onPageChange(item.page)}
              className={`p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-dark-cardHover text-white'
                  : 'text-dark-textSecondary hover:bg-dark-cardHover hover:text-white'
              }`}
              title={item.label}
            >
              <Icon size={24} />
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-4">
        {bottomItems.map((item, index) => {
          const Icon = item.icon
          const isLogout = item.action === 'logout'
          return (
            <button
              key={index}
              onClick={() => {
                if (isLogout) {
                  logout()
                }
              }}
              className="p-3 rounded-lg text-dark-textSecondary hover:bg-dark-cardHover hover:text-white transition-colors"
              title={item.label}
            >
              <Icon size={24} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Sidebar


