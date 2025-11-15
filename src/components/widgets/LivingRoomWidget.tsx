import { Cast, Music, MoreVertical } from 'lucide-react'
import ToggleSwitch from '../ui/ToggleSwitch'

const LivingRoomWidget = () => {
  return (
    <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Cast size={20} />
          <Music size={20} />
          <span className="font-medium">Living Room</span>
        </div>
        <button className="p-1 hover:bg-blue-900 bg-opacity-30 rounded">
          <MoreVertical size={16} />
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Bass</span>
            <span className="text-xs text-dark-textSecondary">45%</span>
          </div>
          <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: '45%' }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Crossfade</span>
          <ToggleSwitch checked={false} onChange={() => {}} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Night Sound</span>
          <ToggleSwitch checked={false} onChange={() => {}} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Speech Enhancement</span>
          <ToggleSwitch checked={false} onChange={() => {}} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Surround Enabled</span>
          <ToggleSwitch checked={false} onChange={() => {}} />
        </div>
      </div>
    </div>
  )
}

export default LivingRoomWidget


