import { Clock, Lightbulb } from 'lucide-react'
import ToggleSwitch from '../ui/ToggleSwitch'

const AmbientLightingWidget = () => {
  const lights = [
    { name: 'Clock Light', icon: Clock, checked: true },
    { name: 'TV Ambilight', icon: Lightbulb, checked: true },
    { name: 'TV Ambilight Hyperion', icon: Lightbulb, checked: true },
    { name: 'Downstairs Lights', icon: Lightbulb, checked: true },
    { name: 'Interior Lights', icon: Lightbulb, checked: true },
    { name: 'Bonus Room Lights', icon: Lightbulb, checked: false },
  ]

  return (
    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
      <div className="font-medium mb-4">Ambient Lighting</div>
      <div className="space-y-3">
        {lights.map((light, index) => {
          const Icon = light.icon
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-yellow-500" />
                <span className="text-sm">{light.name}</span>
              </div>
              <ToggleSwitch checked={light.checked} onChange={() => {}} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AmbientLightingWidget


