import { ChevronRight } from 'lucide-react'

const TVDurationWidget = () => {
  const services = [
    { name: 'Daily Plex', color: 'bg-orange-500', dot: 'bg-orange-500' },
    { name: 'Daily Netflix', color: 'bg-blue-500', dot: 'bg-blue-500' },
    { name: 'Daily Prime Video', color: 'bg-red-500', dot: 'bg-red-500' },
    { name: 'Daily Youtube', color: 'bg-purple-500', dot: 'bg-purple-500' },
  ]

  return (
    <div className="h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-medium text-white">TV Duration</div>
          <div className="text-sm text-dark-textSecondary">0h</div>
        </div>
        <ChevronRight size={16} className="text-dark-textSecondary" />
      </div>
      <div className="space-y-2">
        {services.map((service, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className={`w-2.5 h-2.5 rounded-full ${service.dot} shadow-lg`} />
            <span className="text-sm text-white">{service.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TVDurationWidget


