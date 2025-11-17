import { useState, useEffect } from 'react'
import { ChevronLeft, Play, Pause, ChevronRight, Power } from 'lucide-react'
import { getSpotifyConfigSync, SpotifyConfig } from '../../services/widgetConfig'

const SpotifyWidget = () => {
  const [config, setConfig] = useState<SpotifyConfig>(() => {
    try {
      return getSpotifyConfigSync()
    } catch {
      return {
        accountName: 'Spotify Heta Sanghvi',
        trackName: 'Arms',
        artistName: 'The Paper Kites',
        deviceName: 'Office',
        coverEmoji: '🎵',
        isPlaying: true,
        progress: 45
      }
    }
  })

  useEffect(() => {
    const handleWidgetsChanged = () => {
      try {
        setConfig(getSpotifyConfigSync())
      } catch (error) {
        console.error('SpotifyWidget: ошибка загрузки конфигурации', error)
      }
    }
    window.addEventListener('widgets-changed', handleWidgetsChanged)
    return () => window.removeEventListener('widgets-changed', handleWidgetsChanged)
  }, [])

  const progress = Math.max(0, Math.min(100, config.progress ?? 0))

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-medium mb-1 text-white">{config.accountName}</div>
          <div className="text-sm text-dark-textSecondary">
            {config.trackName} - {config.artistName}
          </div>
        </div>
        <select className="bg-dark-bg/50 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-white backdrop-blur-sm">
          <option>{config.deviceName}</option>
        </select>
      </div>
      
      <div className="mb-4 h-32 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
        <div className="text-center text-white">
          <div className="text-4xl mb-2">{config.coverEmoji || '🎵'}</div>
          <div className="text-xs opacity-75">Album Art</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-3">
        <button className="widget-button p-2.5 rounded-lg text-white hover:text-green-400">
          <ChevronLeft size={20} />
        </button>
        <button className="widget-button p-3 rounded-full bg-green-500 hover:bg-green-600 text-white glow-effect">
          {config.isPlaying ? <Pause size={20} /> : <Play size={20} />}
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


