import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getACConfig } from '../../services/widgetConfig'
import { Snowflake, Flame, Droplets, Fan, Power, Settings } from 'lucide-react'

const ACWidget = () => {
  const [configEntityId, setConfigEntityId] = useState<string | null>(null)
  const { api } = useHomeAssistant()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const config = getACConfig()
    setConfigEntityId(config.entityId)
  }, [])

  useEffect(() => {
    if (api && configEntityId) {
      loadEntity()
      const interval = setInterval(loadEntity, 2000)
      return () => clearInterval(interval)
    }
  }, [api, configEntityId])

  const loadEntity = async () => {
    if (!api || !configEntityId) return

    try {
      const state = await api.getState(configEntityId)
      setEntity(state)
    } catch (error) {
      console.error('Ошибка загрузки состояния кондиционера:', error)
    }
  }

  const handleSetTemperature = async (temperature: number) => {
    if (!api || !configEntityId) return

    setLoading(true)
    try {
      await api.callService({
        domain: 'climate',
        service: 'set_temperature',
        target: { entity_id: configEntityId },
        service_data: { temperature }
      })
      await loadEntity()
    } catch (error) {
      console.error('Ошибка установки температуры:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetMode = async (mode: string) => {
    if (!api || !configEntityId) return

    setLoading(true)
    try {
      await api.callService({
        domain: 'climate',
        service: 'set_hvac_mode',
        target: { entity_id: configEntityId },
        service_data: { hvac_mode: mode }
      })
      await loadEntity()
    } catch (error) {
      console.error('Ошибка установки режима:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTurnOn = async () => {
    if (!api || !configEntityId) return
    await handleSetMode('cool') // или другой режим по умолчанию
  }

  const handleTurnOff = async () => {
    if (!api || !configEntityId) return
    await handleSetMode('off')
  }

  if (!entity) {
    return (
      <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
        <div className="text-center text-dark-textSecondary">
          Кондиционер не настроен
        </div>
      </div>
    )
  }

  const attrs = entity.attributes
  const currentTemp = attrs.current_temperature || attrs.temperature || 0
  const targetTemp = attrs.temperature || attrs.target_temp_high || 25
  const hvacMode = entity.state || 'off'
  const isOn = hvacMode !== 'off'
  const config = getACConfig()
  const friendlyName = config.name || attrs.friendly_name || configEntityId?.split('.')[1] || 'Кондиционер'

  const modes = [
    { id: 'cool', icon: Snowflake, label: 'Охлаждение', color: 'text-blue-400' },
    { id: 'heat', icon: Flame, label: 'Обогрев', color: 'text-red-400' },
    { id: 'dry', icon: Droplets, label: 'Осушение', color: 'text-cyan-400' },
    { id: 'fan_only', icon: Fan, label: 'Вентилятор', color: 'text-gray-400' },
    { id: 'auto', icon: Settings, label: 'Авто', color: 'text-yellow-400' },
    { id: 'off', icon: Power, label: 'Выкл', color: 'text-gray-500' },
  ]

  const availableModes = attrs.hvac_modes || ['off', 'cool', 'heat', 'auto']
  const filteredModes = modes.filter(m => availableModes.includes(m.id))

  const minTemp = attrs.min_temp || 16
  const maxTemp = attrs.max_temp || 30
  const tempStep = attrs.target_temp_step || 0.5

  const handleTempChange = (delta: number) => {
    const newTemp = Math.max(minTemp, Math.min(maxTemp, targetTemp + delta))
    handleSetTemperature(newTemp)
  }

  // Вычисляем угол для кругового индикатора (0-360 градусов)
  const tempRange = maxTemp - minTemp
  const tempPosition = ((targetTemp - minTemp) / tempRange) * 360

  return (
    <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-lg">{friendlyName}</h3>
        <button className="p-1 hover:bg-dark-cardHover rounded">
          <Settings size={18} className="text-dark-textSecondary" />
        </button>
      </div>

      {/* Круговой регулятор температуры */}
      <div className="relative mb-6">
        <div className="flex flex-col items-center">
          {/* Статус */}
          <div className="mb-2 text-sm font-medium">
            {isOn ? hvacMode.toUpperCase() : 'OFF'}
          </div>

          {/* Круговой индикатор */}
          <div className="relative w-64 h-64 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Фоновый круг */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#2a2a2a"
                strokeWidth="12"
              />
              {/* Активный сегмент */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray={`${(tempPosition / 360) * 502.65} 502.65`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>

            {/* Центральная информация */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold mb-1">
                {targetTemp.toFixed(1)}
              </div>
              <div className="text-lg text-dark-textSecondary mb-2">°C</div>
              <div className="flex items-center gap-1 text-sm text-dark-textSecondary">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                {currentTemp.toFixed(1)} °C
              </div>
            </div>
          </div>

          {/* Кнопки изменения температуры */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleTempChange(-tempStep)}
              disabled={loading || targetTemp <= minTemp}
              className="w-12 h-12 rounded-full bg-dark-bg border border-dark-border hover:bg-dark-cardHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-2xl font-light"
            >
              −
            </button>
            <button
              onClick={() => handleTempChange(tempStep)}
              disabled={loading || targetTemp >= maxTemp}
              className="w-12 h-12 rounded-full bg-dark-bg border border-dark-border hover:bg-dark-cardHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-2xl font-light"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Режимы работы */}
      <div className="flex items-center justify-between gap-2">
        {filteredModes.map((mode) => {
          const Icon = mode.icon
          const isActive = hvacMode === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => {
                if (mode.id === 'off') {
                  handleTurnOff()
                } else {
                  handleSetMode(mode.id)
                }
              }}
              disabled={loading}
              className={`flex-1 p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-bg hover:bg-dark-cardHover text-dark-textSecondary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={mode.label}
            >
              <Icon size={24} className={`mx-auto ${isActive ? 'text-white' : mode.color}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ACWidget

