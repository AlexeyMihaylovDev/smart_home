import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { Cloud, Sun, Wind, Calendar as CalendarIcon } from 'lucide-react'

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
          const dayNamesShort = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
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

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const dayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']

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
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weatherData.condition)}
              <div>
                <div className="font-medium text-lg">{weatherData.condition}</div>
                <div className="text-sm text-yellow-400">{weatherData.location}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{weatherData.temperature.toFixed(1)}°C</div>
              <div className="flex items-center gap-1 text-sm text-dark-textSecondary">
                <Wind size={14} className="text-yellow-400" />
                {weatherData.windSpeed.toFixed(1)} km/h {weatherData.windDirection && `(${weatherData.windDirection})`}
              </div>
            </div>
          </div>

          {/* Прогноз на 5 дней */}
          <div className="flex gap-4 justify-between">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="text-xs text-dark-textSecondary mb-1">{day.day}</div>
                <div className="flex justify-center mb-1">
                  {getWeatherIcon(day.condition)}
                </div>
                <div className="text-sm font-medium">{day.high.toFixed(1)}°</div>
                <div className="text-xs text-yellow-400">{day.low.toFixed(1)}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Календарь */}
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-1">Calendar</h3>
        </div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs bg-dark-cardHover hover:bg-dark-border rounded transition-colors"
          >
            СЕГОДНЯ
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-dark-cardHover rounded transition-colors"
            >
              ←
            </button>
            <span className="font-medium min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-dark-cardHover rounded transition-colors"
            >
              →
            </button>
          </div>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-xs text-dark-textSecondary text-center py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Календарная сетка */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
              className={`aspect-square flex items-center justify-center text-sm rounded transition-colors ${
                !day 
                  ? 'cursor-default' 
                  : isToday(day)
                  ? 'bg-blue-600 text-white font-bold'
                  : selectedDate.getDate() === day && 
                    selectedDate.getMonth() === currentDate.getMonth() &&
                    selectedDate.getFullYear() === currentDate.getFullYear()
                  ? 'bg-dark-cardHover text-white'
                  : 'hover:bg-dark-cardHover text-dark-textSecondary'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Текущее время */}
        <div className="mt-4 pt-4 border-t border-dark-border text-center">
          <div className="text-2xl font-bold">
            {currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm text-dark-textSecondary">
            {currentTime.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherCalendarWidget

