import { Cast, Music, MoreVertical } from 'lucide-react'

const MediaRoomWidget = () => {
  return (
    <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Cast size={20} />
          <Music size={20} />
          <span className="font-medium">Media Room</span>
        </div>
        <button className="p-1 hover:bg-blue-900 bg-opacity-30 rounded">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  )
}

export default MediaRoomWidget


