import { ChevronRight } from 'lucide-react'

const PlexWidget = () => {
  return (
    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold">
            P
          </div>
          <span className="font-medium">Plex</span>
        </div>
        <ChevronRight size={16} className="text-dark-textSecondary" />
      </div>
      <div className="mb-4">
        <div className="text-sm text-dark-textSecondary mb-2">0 Watching</div>
        <div className="h-16 flex items-end gap-1">
          {[20, 35, 25, 40, 30, 45, 35].map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-orange-500 rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlexWidget


