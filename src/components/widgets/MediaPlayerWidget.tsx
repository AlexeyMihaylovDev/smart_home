import { ChevronDown, Power } from 'lucide-react'

const MediaPlayerWidget = () => {
  const players = [
    { name: 'Spotify', logo: '🎵', active: true },
    { name: 'Apple', logo: '🍎', active: true },
    { name: 'Android TV', logo: '📱', active: false },
  ]

  return (
    <div className="h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <span className="text-lg">📺</span>
          </div>
          <span className="font-medium text-white">TV</span>
        </div>
        <ChevronDown size={20} className="text-dark-textSecondary" />
      </div>
      <div className="space-y-3">
        {players.map((player, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">{player.logo}</span>
              <span className="text-sm text-white">{player.name}</span>
            </div>
            {player.active && (
              <div className="p-1.5 bg-orange-500/20 rounded-full">
                <Power size={14} className="text-orange-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MediaPlayerWidget


