import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Cloud, Sun, Wind } from 'lucide-react'

interface WeatherData {
  condition: string
  temperature: number
  windSpeed: number
  windDirection: string
  location: string
  forecast: Array<{
    day: string
    condition: string
    high: number
    low: number
  }>
}

const WeatherCalendarWidget = () => {
  const { api } = useHomeAssistant()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (api) {
      loadWeatherData()
      // Обновляем погоду каждые 10 минут
      const weatherInterval = setInterval(loadWeatherData, 600000)
      return () => clearInterval(weatherInterval)
    }
  }, [api])

  useEffect(() => {
    // Обновляем время каждую секунду
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const loadWeatherData = async () => {
    if (!api) return

    try {
      // Пытаемся найти weather entity
      const states = await api.getStates()
      const weatherEntity = states.find(e =>
        e.entity_id.startsWith('weather.') ||
        e.entity_id.includes('weather') ||
        e.entity_id.includes('forecast')
      )

      if (weatherEntity) {
        const attrs = weatherEntity.attributes

        // Получаем текущую погоду
        const condition = attrs.condition || attrs.state || 'Unknown'
        const temperature = attrs.temperature || 0
        const windSpeed = attrs.wind_speed || 0
        const windDirection = attrs.wind_bearing ? getWindDirection(attrs.wind_bearing) : ''
        const location = attrs.friendly_name || 'Home'

        // Получаем прогноз
        const forecast = attrs.forecast ? attrs.forecast.slice(0, 5).map((f: any, index: number) => {
          const date = new Date()
          date.setDate(date.getDate() + index + 1)
          const dayNamesShort = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\'']
          return {
            day: dayNamesShort[date.getDay()],
            condition: f.condition || 'sunny',
            high: f.temperature || f.templow || 0,
            low: f.templow || f.temperature || 0
          }
        }) : []

        setWeatherData({
          condition,
          temperature,
          windSpeed,
          windDirection,
          location,
          forecast
        })
      } else {
        // Демо данные если нет weather entity
        setWeatherData({
          condition: 'Cloudy',
          temperature: 9.7,
          windSpeed: 24.5,
          windDirection: 'SW',
          location: 'Home',
          forecast: [
            { day: 'Sun', condition: 'partly-cloudy', high: 16.9, low: 9 },
            { day: 'Mon', condition: 'partly-cloudy', high: 16.8, low: 7.8 },
            { day: 'Tue', condition: 'partly-cloudy', high: 8.6, low: 5.8 },
            { day: 'Wed', condition: 'sunny', high: 9.6, low: 4.6 },
            { day: 'Thu', condition: 'sunny', high: 11.6, low: 5.4 }
          ]
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки погоды:', error)
      // Демо данные при ошибке
      setWeatherData({
        condition: 'Cloudy',
        temperature: 9.7,
        windSpeed: 24.5,
        windDirection: 'SW',
        location: 'Home',
        forecast: [
          { day: 'Sun', condition: 'partly-cloudy', high: 16.9, low: 9 },
          { day: 'Mon', condition: 'partly-cloudy', high: 16.8, low: 7.8 },
          { day: 'Tue', condition: 'partly-cloudy', high: 8.6, low: 5.8 },
          { day: 'Wed', condition: 'sunny', high: 9.6, low: 4.6 },
          { day: 'Thu', condition: 'sunny', high: 11.6, low: 5.4 }
        ]
      })
    }
  }

  const getWindDirection = (bearing: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return directions[Math.round(bearing / 45) % 8]
  }

  const getWeatherIcon = (condition: string, size: number = 24) => {
    const cond = condition.toLowerCase()
    if (cond.includes('sun') || cond === 'clear' || cond === 'sunny') {
      return <Sun size={size} className="text-yellow-400" />
    } else if (cond.includes('partly') || (cond.includes('cloud') && cond.includes('sun'))) {
      return (
        <div className="relative inline-block">
          <Cloud size={size} className="text-gray-400" />
          <Sun size={size * 0.5} className="text-yellow-400 absolute -top-1 -right-1" />
        </div>
      )
    } else if (cond.includes('cloud')) {
      return <Cloud size={size} className="text-gray-400" />
    }
    return <Cloud size={size} className="text-gray-400" />
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Пустые дни в начале месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
  const dayNames = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\'']

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    const today = new Date()
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Погода */}
      {weatherData && (
        <div className="p-3 border-b border-white/5 flex-shrink-0 bg-gradient-to-r from-accent-blue/5 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-blue/10">
                {getWeatherIcon(weatherData.condition)}
              </div>
              <div>
                <div className="font-medium text-base text-white">{weatherData.condition}</div>
                <div className="text-xs text-accent-cyan">{weatherData.location}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
                {weatherData.temperature.toFixed(1)}°C
              </div>
              <div className="flex items-center gap-1 text-xs text-dark-textSecondary">
                <Wind size={12} className="text-accent-cyan" />
                {weatherData.windSpeed.toFixed(1)} km/h {weatherData.windDirection && `(${weatherData.windDirection})`}
              </div>
            </div>
          </div>

          {/* Прогноз на 5 дней */}
          <div className="flex gap-2 justify-between">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="flex-1 text-center p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="text-[10px] text-dark-textSecondary mb-1">{day.day}</div>
                <div className="flex justify-center mb-1">
                  {getWeatherIcon(day.condition)}
                </div>
                <div className="text-xs font-semibold text-white">{day.high.toFixed(0)}°</div>
                <div className="text-[10px] text-accent-cyan">{day.low.toFixed(0)}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Календарь */}
      <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="mb-2 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">לוח שנה</h3>
        </div>

        {/* Текущее время */}
        <div className="mb-2 pb-2 border-b border-white/5 text-center flex-shrink-0 bg-gradient-to-r from-accent-purple/10 via-transparent to-accent-blue/10 rounded-lg p-2">
          <div className="text-lg font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-[10px] text-dark-textSecondary leading-tight mt-1">
            {currentTime.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-1 flex-shrink-0">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-1.5 py-0.5 text-[10px] bg-dark-cardHover hover:bg-dark-border rounded transition-colors"
          >
            היום
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-0.5 hover:bg-dark-cardHover rounded transition-colors text-xs"
            >
              ←
            </button>
            <span className="font-medium min-w-[80px] text-center text-xs">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-0.5 hover:bg-dark-cardHover rounded transition-colors text-xs"
            >
              →
            </button>
          </div>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-0.5 mb-0.5 flex-shrink-0">
          {dayNames.map(day => (
            <div key={day} className="text-[10px] text-dark-textSecondary text-center py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Календарная сетка */}
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
              className={`flex items-center justify-center text-[11px] rounded-lg transition-all ${!day
                ? 'cursor-default'
                : isToday(day)
                  ? 'bg-accent-blue text-white font-bold shadow-lg shadow-blue-500/30'
                  : selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentDate.getMonth() &&
                    selectedDate.getFullYear() === currentDate.getFullYear()
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'hover:bg-white/5 text-dark-textSecondary'
                }`}
              style={{ minHeight: '20px' }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WeatherCalendarWidget

