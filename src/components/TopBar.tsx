import { Car, Home, Smile, Monitor, Shield, Globe, Camera, Folder } from 'lucide-react'

const TopBar = () => {
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
    <div className="h-16 bg-dark-card border-b border-dark-border flex items-center px-6 gap-4">
      {icons.map((item, index) => {
        const Icon = item.icon
        return (
          <button
            key={index}
            className="p-2 rounded-lg text-dark-textSecondary hover:bg-dark-cardHover hover:text-white transition-colors"
            title={item.label}
          >
            <Icon size={20} />
          </button>
        )
      })}
    </div>
  )
}

export default TopBar


