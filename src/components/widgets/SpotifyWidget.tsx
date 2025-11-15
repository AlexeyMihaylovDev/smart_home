import { ChevronLeft, Play, Pause, ChevronRight, Power } from 'lucide-react'

const SpotifyWidget = () => {
  const isPlaying = true
  const progress = 45

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-medium mb-1 text-white">Spotify Heta Sanghvi</div>
          <div className="text-sm text-dark-textSecondary">Arms - The Paper Kites</div>
        </div>
        <select className="bg-dark-bg/50 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-white backdrop-blur-sm">
          <option>Office</option>
        </select>
      </div>
      
      <div className="mb-4 h-32 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
        <div className="text-center text-white">
          <div className="text-4xl mb-2">🎵</div>
          <div className="text-xs opacity-75">Album Art</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-3">
        <button className="widget-button p-2.5 rounded-lg text-white hover:text-green-400">
          <ChevronLeft size={20} />
        </button>
        <button className="widget-button p-3 rounded-full bg-green-500 hover:bg-green-600 text-white glow-effect">
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button className="widget-button p-2.5 rounded-lg text-white hover:text-green-400">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="w-full bg-dark-bg/50 h-1.5 rounded-full overflow-hidden mb-2 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default SpotifyWidget


