import { useState, useEffect } from 'react'
import { getClockConfigSync, ClockConfig } from '../../services/widgetConfig'


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
    <div className="h-full p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a15] via-[#12121a] to-[#0a0a15] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
      {/* Декоративные элементы фона - яркие градиенты */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent-blue/30 rounded-full blur-[60px] animate-pulse-slow"></div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent-purple/25 rounded-full blur-[80px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent-cyan/10 rounded-full blur-[40px]"></div>
      </div>

      {/* Сетка паттерн для глубины */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      {/* Основной контент */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {/* Время - крупным шрифтом с text-shadow */}
        <div
          className="text-display text-white mb-2 sm:mb-4 tracking-tight"
          style={{ textShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}
        >
          {timeString}
        </div>

        {/* Дата - под временем */}
        {dateString && (
          <div className="text-body text-white/80 mt-2 sm:mt-4 font-light">
            {dateString}
          </div>
        )}

        {/* Название виджета (опционально) */}
        {clockConfig.name && clockConfig.name !== 'שעון' && (
          <div className="mt-4 sm:mt-6 text-caption">
            {clockConfig.name}
          </div>
        )}
      </div>

      {/* Индикатор обновления (только если показываем секунды) */}
      {clockConfig.showSeconds && (
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 bg-accent-green rounded-full animate-glow shadow-lg shadow-green-500/40"></div>
      )}
    </div>
  )
}

export default ClockWidget



