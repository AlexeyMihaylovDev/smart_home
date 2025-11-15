import { ChevronDown, Power } from 'lucide-react'

const MediaPlayerWidget = () => {
  const players = [
    { name: 'Spotify', logo: '🎵', active: true },
    { name: 'Apple', logo: '🍎', active: true },
    { name: 'Android TV', logo: '📱', active: false },
  ]

  return (
    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium">TV</span>
        <ChevronDown size={20} className="text-dark-textSecondary" />
      </div>
      <div className="space-y-3">
        {players.map((player, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{player.logo}</span>
              <span className="text-sm">{player.name}</span>
            </div>
            {player.active && (
              <Power size={16} className="text-orange-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MediaPlayerWidget


