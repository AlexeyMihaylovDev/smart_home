import { Cast, Power, ChevronLeft, Play, Pause, ChevronRight } from 'lucide-react'

const CanvasWidget = () => {
  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Cast size={18} className="text-purple-400" />
        </div>
        <div>
          <div className="font-medium text-white">Canvas</div>
          <div className="text-sm text-dark-textSecondary">DSC_0533</div>
        </div>
      </div>
      
      <div className="mb-4 h-32 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
        <div className="text-center text-white text-xs opacity-75">
          Video Preview
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button className="widget-button p-2 rounded-lg text-white hover:text-red-400">
          <Power size={16} />
        </button>
        <button className="widget-button p-2 rounded-lg text-white hover:text-purple-400">
          <ChevronLeft size={16} />
        </button>
        <button className="widget-button p-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white glow-effect">
          <Play size={16} />
        </button>
        <button className="widget-button p-2 rounded-lg text-white hover:text-purple-400">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default CanvasWidget


