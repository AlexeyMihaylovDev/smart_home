import { Tv } from 'lucide-react'
import ToggleSwitch from '../ui/ToggleSwitch'

const TVTimeWidget = () => {
  return (
    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Tv size={20} className="text-dark-textSecondary" />
          <span className="font-medium">TV Time</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-dark-textSecondary">3 minutes ago</span>
        <ToggleSwitch checked={true} onChange={() => {}} />
      </div>
    </div>
  )
}

export default TVTimeWidget


