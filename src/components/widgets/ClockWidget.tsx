import { useState, useEffect } from 'react'
import { getClockConfigSync, ClockConfig } from '../../services/widgetConfig'
import { Clock } from 'lucide-react'

const ClockWidget = () => {
  const [clockConfig, setClockConfig] = useState<ClockConfig>(() => {
    try {
      return getClockConfigSync()
    } catch {
      return {
        name: 'שעון',
        showSeconds: false,
        showDate: true,
        showDayOfWeek: true,
        format24h: true,
        style: 'digital'
      }
    }
  })

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, clockConfig.showSeconds ? 1000 : 60000) // Обновляем каждую секунду или минуту

    return () => clearInterval(interval)
  }, [clockConfig.showSeconds])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config') {
        try {
          const config = getClockConfigSync()
          setClockConfig(config)
        } catch (error) {
          console.error('Ошибка загрузки конфигурации часов:', error)
        }
      }
    }

    const handleWidgetsChanged = () => {
      try {
        const config = getClockConfigSync()
        setClockConfig(config)
      } catch (error) {
        console.error('Ошибка загрузки конфигурации часов:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  // Форматируем время
  const formatTime = (date: Date): string => {
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()

    if (!clockConfig.format24h) {
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12 // 0 часов = 12
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${clockConfig.showSeconds ? `:${String(seconds).padStart(2, '0')}` : ''} ${ampm}`
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${clockConfig.showSeconds ? `:${String(seconds).padStart(2, '0')}` : ''}`
  }

  // Форматируем дату
  const formatDate = (date: Date): string => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    const dayOfWeek = daysOfWeek[date.getDay()]
    const month = months[date.getMonth()]
    const day = date.getDate()

    if (clockConfig.showDayOfWeek && clockConfig.showDate) {
      return `${dayOfWeek}, ${month} ${day}`
    } else if (clockConfig.showDayOfWeek) {
      return dayOfWeek
    } else if (clockConfig.showDate) {
      return `${month} ${day}`
    }
    return ''
  }

  const timeString = formatTime(currentTime)
  const dateString = formatDate(currentTime)

  return (
    <div className="h-full p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black rounded-lg border border-gray-800 shadow-2xl relative overflow-hidden">
      {/* Декоративные элементы фона */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      {/* Основной контент */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {/* Время - крупным шрифтом */}
        <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-white mb-2 sm:mb-4 tracking-tight">
          {timeString}
        </div>

        {/* Дата - под временем */}
        {dateString && (
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-white/80 mt-2 sm:mt-4">
            {dateString}
          </div>
        )}

        {/* Название виджета (опционально) */}
        {clockConfig.name && clockConfig.name !== 'שעון' && (
          <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/50 font-medium">
            {clockConfig.name}
          </div>
        )}
      </div>

      {/* Индикатор обновления (только если показываем секунды) */}
      {clockConfig.showSeconds && (
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      )}
    </div>
  )
}

export default ClockWidget



