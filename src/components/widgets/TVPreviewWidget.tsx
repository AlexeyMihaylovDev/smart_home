const TVPreviewWidget = () => {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="h-32 bg-gradient-to-br from-orange-500/30 via-yellow-500/30 to-orange-600/30 relative border-b border-white/10">
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="text-white text-xs opacity-75">Golden Gate Bridge</div>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between flex-1">
        <span className="font-medium text-white">TV Preview</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 pulse-animation"></div>
          <span className="text-sm text-green-400 font-medium">On</span>
        </div>
      </div>
    </div>
  )
}

export default TVPreviewWidget


