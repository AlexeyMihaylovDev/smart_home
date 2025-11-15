import { Cast, Power, ChevronLeft, Play, Pause, ChevronRight } from 'lucide-react'

const CanvasWidget = () => {
  return (
    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
      <div className="flex items-center gap-3 mb-4">
        <Cast size={20} className="text-dark-textSecondary" />
        <div>
          <div className="font-medium">Canvas</div>
          <div className="text-sm text-dark-textSecondary">DSC_0533</div>
        </div>
      </div>
      
      <div className="mb-4 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white text-xs opacity-75">
          Video Preview
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
          <Power size={16} />
        </button>
        <button className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
          <ChevronLeft size={16} />
        </button>
        <button className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
          <Play size={16} />
        </button>
        <button className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default CanvasWidget


