import { Cast, Music, MoreVertical } from 'lucide-react'

const MediaRoomWidget = () => {
  return (
    <div className="h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Cast size={18} className="text-blue-400" />
          </div>
          <Music size={18} className="text-blue-400" />
          <span className="font-medium text-white">Media Room</span>
        </div>
        <button className="p-1 hover:bg-white/5 rounded transition-colors">
          <MoreVertical size={16} className="text-dark-textSecondary" />
        </button>
      </div>
    </div>
  )
}

export default MediaRoomWidget


