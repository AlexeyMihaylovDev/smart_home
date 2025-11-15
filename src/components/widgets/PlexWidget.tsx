import { ChevronRight } from 'lucide-react'

const PlexWidget = () => {
  return (
    <div className="h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
            P
          </div>
          <span className="font-medium text-white">Plex</span>
        </div>
        <ChevronRight size={16} className="text-dark-textSecondary" />
      </div>
      <div className="mb-4">
        <div className="text-sm text-dark-textSecondary mb-2">0 Watching</div>
        <div className="h-16 flex items-end gap-1">
          {[20, 35, 25, 40, 30, 45, 35].map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all hover:from-orange-400 hover:to-orange-300"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlexWidget


