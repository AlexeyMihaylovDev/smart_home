import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getACConfigs, ACConfig } from '../../services/widgetConfig'
import { Snowflake, Flame, Droplets, Fan, Power, Settings, MoreVertical, Thermometer, ChevronDown } from 'lucide-react'

const ACWidget = () => {
  const [acConfigs, setACConfigs] = useState<ACConfig[]>([])
  const [selectedACIndex, setSelectedACIndex] = useState<number>(0)
  const { api } = useHomeAssistant()
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfigs = () => {
      const configs = getACConfigs()
      console.log('ACWidget: загружены конфигурации:', configs)
      setACConfigs(configs)
      if (configs.length > 0 && selectedACIndex >= configs.length) {
        setSelectedACIndex(0)
      }
    }

    loadConfigs()

    // Слушаем изменения конфигурации
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config') {
        console.log('ACWidget: обнаружено изменение в localStorage')
        loadConfigs()
      }
    }

    const handleWidgetsChanged = () => {
      console.log('ACWidget: получено событие widgets-changed')
      loadConfigs()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  const selectedAC = acConfigs[selectedACIndex]
  const configEntityId = selectedAC?.entityId || null

  useEffect(() => {
    if (api && acConfigs.length > 0) {
      loadEntities()
      const interval = setInterval(loadEntities, 2000)
      return () => clearInterval(interval)
    }
  }, [api, acConfigs])

  const loadEntities = async () => {
    if (!api || acConfigs.length === 0) return

    try {
      const entityIds = acConfigs
        .map(ac => ac.entityId)
        .filter((id): id is string => id !== null)

      if (entityIds.length === 0) return

      const states = await Promise.all(
        entityIds.map(id => api.getState(id).catch(() => null))
      )

      const newEntities = new Map<string, Entity>()
      entityIds.forEach((id, index) => {
        const state = states[index]
        if (state) {
          newEntities.set(id, state)
        }
      })

      setEntities(newEntities)
    } catch (error) {
      console.error('Ошибка загрузки состояний кондиционеров:', error)
    }
  }

  const entity = configEntityId ? entities.get(configEntityId) : null

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

  const handleSetFanMode = async (fanMode: string) => {
    if (!api || !configEntityId) return

    setLoading(true)
    try {
      await api.callService({
        domain: 'climate',
        service: 'set_fan_mode',
        target: { entity_id: configEntityId },
        service_data: { fan_mode: fanMode }
      })
      await loadEntity()
    } catch (error) {
      console.error('Ошибка установки скорости вентилятора:', error)
    } finally {
      setLoading(false)
    }
  }

  if (acConfigs.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">Кондиционеры не настроены</div>
          <div className="text-xs text-dark-textSecondary">Настройте в Settings → Настройка виджетов</div>
        </div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">Кондиционер "{selectedAC?.name || 'Неизвестный'}" не подключен</div>
          <div className="text-xs text-dark-textSecondary">Проверьте настройки entity_id</div>
        </div>
      </div>
    )
  }

  const attrs = entity.attributes
  const currentTemp = attrs.current_temperature || 0
  const targetTemp = attrs.temperature || attrs.target_temp_high || 25
  const hvacMode = entity.state || 'off'
  const fanMode = attrs.fan_mode || 'auto'
  const isOn = hvacMode !== 'off'
  const friendlyName = selectedAC?.name || attrs.friendly_name || configEntityId?.split('.')[1] || 'Кондиционер'

  const modes = [
    { id: 'cool', icon: Snowflake, label: 'Охлаждение', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { id: 'heat', icon: Flame, label: 'Обогрев', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    { id: 'dry', icon: Droplets, label: 'Осушение', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    { id: 'fan_only', icon: Fan, label: 'Вентилятор', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
    { id: 'auto', icon: Settings, label: 'Авто', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { id: 'off', icon: Power, label: 'Выкл', color: 'text-gray-500', bgColor: 'bg-gray-500/20' },
  ]

  const availableModes = attrs.hvac_modes || ['off', 'cool', 'heat', 'auto']
  const filteredModes = modes.filter(m => availableModes.includes(m.id))

  const availableFanModes = attrs.fan_modes || []
  const hasFanControl = availableFanModes.length > 0

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

  // Получаем название режима для отображения
  const getModeLabel = (mode: string) => {
    const modeMap: Record<string, string> = {
      'cool': 'COOL',
      'heat': 'HEAT',
      'dry': 'DRY',
      'fan_only': 'FAN',
      'auto': 'AUTO',
      'off': 'OFF'
    }
    return modeMap[mode] || mode.toUpperCase()
  }

  return (
    <div className="h-full p-6 flex flex-col">
      {/* Заголовок с выбором кондиционера */}
      <div className="flex items-center justify-between mb-4">
        {acConfigs.length > 1 ? (
          <div className="relative flex-1">
            <select
              value={selectedACIndex}
              onChange={(e) => setSelectedACIndex(Number(e.target.value))}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 pr-8 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              {acConfigs.map((ac, index) => (
                <option key={index} value={index}>
                  {ac.name || `Кондиционер ${index + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary pointer-events-none" />
          </div>
        ) : (
          <h3 className="font-medium text-lg text-white">{friendlyName}</h3>
        )}
        <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
          <MoreVertical size={18} className="text-dark-textSecondary" />
        </button>
      </div>

      {/* Круговой регулятор температуры */}
      <div className="relative mb-4 flex items-center justify-center flex-1 min-h-0">
        <div className="flex items-center gap-6">
          {/* Кнопка уменьшения температуры (слева) */}
          <button
            onClick={() => handleTempChange(-tempStep)}
            disabled={loading || targetTemp <= minTemp || !isOn}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-3xl font-light text-white hover:scale-110 active:scale-95 shadow-lg"
          >
            −
          </button>

          {/* Центральная часть с кругом */}
          <div className="flex flex-col items-center">
            {/* Статус */}
            <div className="mb-3 text-sm font-semibold text-white">
              {getModeLabel(hvacMode)}
            </div>

            {/* Круговой индикатор */}
            <div className="relative w-56 h-56">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                {/* Фоновый круг */}
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="10"
                />
                {/* Активный сегмент */}
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke={isOn ? "#3b82f6" : "#6b7280"}
                  strokeWidth="10"
                  strokeDasharray={`${(tempPosition / 360) * 471.24} 471.24`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Центральная информация */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold mb-1 text-white">
                  {targetTemp.toFixed(1)}
                </div>
                <div className="text-lg text-dark-textSecondary mb-2">°C</div>
                <div className="flex items-center gap-1.5 text-sm text-dark-textSecondary">
                  <Thermometer size={14} className="text-blue-400" />
                  <span>{currentTemp.toFixed(1)} °C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка увеличения температуры (справа) */}
          <button
            onClick={() => handleTempChange(tempStep)}
            disabled={loading || targetTemp >= maxTemp || !isOn}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-3xl font-light text-white hover:scale-110 active:scale-95 shadow-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Режимы работы */}
      <div className="flex items-center justify-between gap-2 mb-3">
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
              className={`flex-1 p-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-dark-textSecondary border border-white/5'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
              title={mode.label}
            >
              <Icon size={22} className={`mx-auto ${isActive ? 'text-white' : mode.color}`} />
            </button>
          )
        })}
      </div>

      {/* Управление вентилятором (если поддерживается) */}
      {hasFanControl && isOn && (
        <div className="mt-2 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-textSecondary">Скорость вентилятора</span>
            <span className="text-xs font-medium text-white">{fanMode.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            {availableFanModes.map((fm: string) => (
              <button
                key={fm}
                onClick={() => handleSetFanMode(fm)}
                disabled={loading}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs transition-all ${
                  fanMode === fm
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-dark-textSecondary'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {fm}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ACWidget

