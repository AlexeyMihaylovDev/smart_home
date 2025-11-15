const TVPreviewWidget = () => {
  return (
    <div className="bg-dark-card rounded-lg overflow-hidden border border-dark-border">
      <div className="h-32 bg-gradient-to-br from-orange-900 via-yellow-800 to-orange-700 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xs opacity-75">Golden Gate Bridge</div>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <span className="font-medium">TV Preview</span>
        <span className="text-sm text-green-500">On</span>
      </div>
    </div>
  )
}

export default TVPreviewWidget


