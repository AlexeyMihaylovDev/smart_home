import { ChevronLeft, Play, Pause, ChevronRight, Power } from 'lucide-react'

const SpotifyWidget = () => {
  const isPlaying = true
  const progress = 45

  return (
    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-medium mb-1">Spotify Heta Sanghvi</div>
          <div className="text-sm text-dark-textSecondary">Arms - The Paper Kites</div>
        </div>
        <select className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm">
          <option>Office</option>
        </select>
      </div>
      
      <div className="mb-4 h-32 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xs opacity-75">Album Art</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-3">
        <button className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </button>
        <button className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="w-full bg-dark-bg h-1 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default SpotifyWidget


