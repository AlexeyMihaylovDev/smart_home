import { Tv } from 'lucide-react'
import ToggleSwitch from '../ui/ToggleSwitch'

const TVTimeWidget = () => {
  return (
    <div className="h-full p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Tv size={20} className="text-blue-400" />
          </div>
          <span className="font-medium text-white">TV Time</span>
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


