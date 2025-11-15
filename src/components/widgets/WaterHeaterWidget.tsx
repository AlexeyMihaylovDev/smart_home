import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getWaterHeaterConfigSync } from '../../services/widgetConfig'
import { Flame, Power, MoreVertical, Thermometer } from 'lucide-react'

const WaterHeaterWidget = () => {
  const [configEntityId, setConfigEntityId] = useState<string | null>(null)
  const { api } = useHomeAssistant()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfig = () => {
      const config = getWaterHeaterConfigSync()
      setConfigEntityId(config.entityId)
    }

    loadConfig()

    const handleWidgetsChanged = () => {
      console.log('WaterHeaterWidget: получено событие widgets-changed')
      loadConfig()
    }

    window.addEventListener('widgets-changed', handleWidgetsChanged)
    return () => {
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
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
      console.error('Ошибка загрузки состояния водонагревателя:', error)
    }
  }

  const handleSetTemperature = async (temperature: number) => {
    if (!api || !configEntityId) return

    setLoading(true)
    try {
      // Пробуем water_heater domain сначала
      const domain = configEntityId.split('.')[0]
      if (domain === 'water_heater') {
        await api.callService({
          domain: 'water_heater',
          service: 'set_temperature',
          target: { entity_id: configEntityId },
          service_data: { temperature }
        })
      } else if (domain === 'climate') {
        await api.callService({
          domain: 'climate',
          service: 'set_temperature',
          target: { entity_id: configEntityId },
          service_data: { temperature }
        })
      }
      await loadEntity()
    } catch (error) {
      console.error('Ошибка установки температуры:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTurnOn = async () => {
    if (!api || !configEntityId) return
    const domain = configEntityId.split('.')[0]
    
    setLoading(true)
    try {
      if (domain === 'water_heater') {
        await api.callService({
          domain: 'water_heater',
          service: 'turn_on',
          target: { entity_id: configEntityId }
        })
      } else if (domain === 'climate') {
        await api.callService({
          domain: 'climate',
          service: 'set_hvac_mode',
          target: { entity_id: configEntityId },
          service_data: { hvac_mode: 'heat' }
        })
      }
      await loadEntity()
    } catch (error) {
      console.error('Ошибка включения водонагревателя:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTurnOff = async () => {
    if (!api || !configEntityId) return
    const domain = configEntityId.split('.')[0]
    
    setLoading(true)
    try {
      if (domain === 'water_heater') {
        await api.callService({
          domain: 'water_heater',
          service: 'turn_off',
          target: { entity_id: configEntityId }
        })
      } else if (domain === 'climate') {
        await api.callService({
          domain: 'climate',
          service: 'set_hvac_mode',
          target: { entity_id: configEntityId },
          service_data: { hvac_mode: 'off' }
        })
      }
      await loadEntity()
    } catch (error) {
      console.error('Ошибка выключения водонагревателя:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!entity) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">Водонагреватель не настроен</div>
          <div className="text-xs text-dark-textSecondary">Настройте в Settings → Настройка виджетов</div>
        </div>
      </div>
    )
  }

  const attrs = entity.attributes
  const domain = configEntityId?.split('.')[0] || ''
  
  // Для water_heater
  let currentTemp = attrs.current_temperature || 0
  let targetTemp = attrs.temperature || 0
  let isOn = false
  
  // Для climate
  if (domain === 'climate') {
    currentTemp = attrs.current_temperature || 0
    targetTemp = attrs.temperature || attrs.target_temp_high || 0
    isOn = entity.state !== 'off'
  } else if (domain === 'water_heater') {
    currentTemp = attrs.current_temperature || 0
    targetTemp = attrs.temperature || 0
    isOn = entity.state !== 'off' && entity.state !== 'eco'
  }

  const config = getWaterHeaterConfigSync()
  const friendlyName = config.name || attrs.friendly_name || configEntityId?.split('.')[1] || 'Водонагреватель'

  const minTemp = attrs.min_temp || 20
  const maxTemp = attrs.max_temp || 80
  const tempStep = attrs.target_temp_step || 1

  const handleTempChange = (delta: number) => {
    const newTemp = Math.max(minTemp, Math.min(maxTemp, targetTemp + delta))
    handleSetTemperature(newTemp)
  }

  // Вычисляем угол для кругового индикатора (0-360 градусов)
  const tempRange = maxTemp - minTemp
  const tempPosition = ((targetTemp - minTemp) / tempRange) * 360

  return (
    <div className="h-full p-3 flex flex-col items-center justify-center overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="font-medium text-sm text-white truncate flex-1 mr-2">{friendlyName}</h3>
        <button className="p-1 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
          <MoreVertical size={14} className="text-dark-textSecondary" />
        </button>
      </div>

      {/* Круговой регулятор температуры */}
      <div className="relative mb-2 flex items-center justify-center flex-1 min-h-0 w-full">
        <div className="relative w-full max-w-[140px] aspect-square">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Фоновый круг */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
            />
            {/* Активный сегмент (оранжевый для нагрева) */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={isOn ? "#f97316" : "#6b7280"}
              strokeWidth="12"
              strokeDasharray={`${(tempPosition / 360) * 502.65} 502.65`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* Центральная информация */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] font-semibold mb-0.5 text-white">
              {isOn ? 'HEAT' : 'OFF'}
            </div>
            <div className="text-3xl font-bold mb-0 text-white">
              {targetTemp.toFixed(0)}
            </div>
            <div className="text-xs text-dark-textSecondary mb-1">°C</div>
            <div className="flex items-center gap-0.5 text-[10px] text-dark-textSecondary">
              <Thermometer size={10} className="text-orange-400" />
              <span>{currentTemp.toFixed(0)}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки изменения температуры */}
      <div className="flex items-center justify-center gap-3 mb-2 w-full">
        <button
          onClick={() => handleTempChange(-tempStep)}
          disabled={loading || targetTemp <= minTemp || !isOn}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-light text-white hover:scale-110 active:scale-95 flex-shrink-0"
        >
          −
        </button>
        <button
          onClick={() => handleTempChange(tempStep)}
          disabled={loading || targetTemp >= maxTemp || !isOn}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-light text-white hover:scale-110 active:scale-95 flex-shrink-0"
        >
          +
        </button>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={isOn ? handleTurnOff : handleTurnOn}
          disabled={loading}
          className={`flex-1 py-2 px-2 rounded-lg transition-all ${
            isOn
              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              : 'bg-white/5 hover:bg-white/10 text-dark-textSecondary border border-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          title="Питание"
        >
          <Power size={18} />
        </button>
        <button
          onClick={handleTurnOn}
          disabled={loading || isOn}
          className={`flex-1 py-2 px-2 rounded-lg transition-all ${
            isOn
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-white/5 hover:bg-white/10 text-dark-textSecondary border border-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          title="Нагрев"
        >
          <Flame size={18} />
        </button>
      </div>
    </div>
  )
}

export default WaterHeaterWidget

