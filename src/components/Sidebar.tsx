import { LayoutGrid, Zap, User, List, BarChart, Calendar, Play, Camera, Info } from 'lucide-react'

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', active: true },
    { icon: Zap, label: 'Energy' },
    { icon: User, label: 'Profile' },
    { icon: List, label: 'Devices' },
    { icon: BarChart, label: 'Analytics' },
    { icon: Calendar, label: 'Schedule' },
    { icon: Play, label: 'Scenes' },
  ]

  const bottomItems = [
    { icon: Camera, label: 'Cameras' },
    { icon: Info, label: 'About' },
  ]

  return (
    <div className="w-16 bg-dark-card border-r border-dark-border flex flex-col items-center py-4">
      <div className="flex-1 flex flex-col gap-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={index}
              className={`p-3 rounded-lg transition-colors ${
                item.active
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
          return (
            <button
              key={index}
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


