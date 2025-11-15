import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getACConfigsSync, ACConfig } from '../../services/widgetConfig'
import { Snowflake, Flame, Droplets, Fan, Power, Settings, Thermometer } from 'lucide-react'

interface ACUnitProps {
  acConfig: ACConfig
  entity: Entity | null
  api: any
  loading: boolean
  onLoadingChange: (loading: boolean) => void
}

const ACUnit = ({ acConfig, entity, api, loading, onLoadingChange }: ACUnitProps) => {
  const [localLoading, setLocalLoading] = useState(false)

  const handleSetTemperature = async (temperature: number) => {
    if (!api || !acConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'climate',
        service: 'set_temperature',
        target: { entity_id: acConfig.entityId },
        service_data: { temperature }
      })
    } catch (error) {
      console.error('Ошибка установки температуры:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleSetMode = async (mode: string) => {
    if (!api || !acConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'climate',
        service: 'set_hvac_mode',
        target: { entity_id: acConfig.entityId },
        service_data: { hvac_mode: mode }
      })
    } catch (error) {
      console.error('Ошибка установки режима:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleSetFanMode = async (fanMode: string) => {
    if (!api || !acConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'climate',
        service: 'set_fan_mode',
        target: { entity_id: acConfig.entityId },
        service_data: { fan_mode: fanMode }
      })
    } catch (error) {
      console.error('Ошибка установки скорости вентилятора:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  if (!entity) {
    return (
      <div className="p-4 bg-dark-bg rounded-lg border border-dark-border">
        <div className="text-center text-dark-textSecondary">
          <div className="text-sm mb-1">{acConfig.name}</div>
          <div className="text-xs">Не подключен</div>
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
  const friendlyName = acConfig.name || attrs.friendly_name || acConfig.entityId?.split('.')[1] || 'Кондиционер'

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

  const availableFanModes = attrs.fan_modes || []
  const hasFanControl = availableFanModes.length > 0

  const minTemp = attrs.min_temp || 16
  const maxTemp = attrs.max_temp || 30
  const tempStep = attrs.target_temp_step || 0.5

  const handleTempChange = (delta: number) => {
    const newTemp = Math.max(minTemp, Math.min(maxTemp, targetTemp + delta))
    handleSetTemperature(newTemp)
  }

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

  const isLoading = localLoading || loading

  // Определяем цвет фона в зависимости от режима
  const getTemperatureBgColor = () => {
    if (!isOn) return 'bg-transparent'
    if (hvacMode === 'cool') return 'bg-blue-500/20'
    if (hvacMode === 'heat') return 'bg-red-500/20'
    if (hvacMode === 'dry') return 'bg-cyan-500/20'
    if (hvacMode === 'fan_only') return 'bg-gray-500/20'
    if (hvacMode === 'auto') return 'bg-yellow-500/20'
    return 'bg-transparent'
  }

  return (
    <div className="p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-white/20 transition-all overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-base text-white truncate flex-1 mr-2">{friendlyName}</h3>
        <div className={`text-xs font-semibold px-2 py-1 rounded flex-shrink-0 ${
          isOn ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'
        }`}>
          {getModeLabel(hvacMode)}
        </div>
      </div>

      {/* Температура */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={() => handleTempChange(-tempStep)}
          disabled={isLoading || targetTemp <= minTemp || !isOn}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-2xl font-light text-white hover:scale-110 active:scale-95 flex-shrink-0"
        >
          −
        </button>

        <div className={`flex flex-col items-center min-w-[80px] px-3 py-2 rounded-lg transition-colors ${getTemperatureBgColor()}`}>
          <div className="text-3xl font-bold text-white">
            {targetTemp.toFixed(1)}
          </div>
          <div className="text-xs text-dark-textSecondary">°C</div>
          <div className="flex items-center gap-1 text-xs text-dark-textSecondary mt-1">
            <Thermometer size={12} className="text-blue-400" />
            <span>{currentTemp.toFixed(1)}°</span>
          </div>
        </div>

        <button
          onClick={() => handleTempChange(tempStep)}
          disabled={isLoading || targetTemp >= maxTemp || !isOn}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-2xl font-light text-white hover:scale-110 active:scale-95 flex-shrink-0"
        >
          +
        </button>
      </div>

      {/* Режимы работы */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {filteredModes.map((mode) => {
          const Icon = mode.icon
          const isActive = hvacMode === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => {
                if (mode.id === 'off') {
                  handleSetMode('off')
                } else {
                  handleSetMode(mode.id)
                }
              }}
              disabled={isLoading}
              className={`flex-1 min-w-[40px] p-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-dark-textSecondary border border-white/5'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
              title={mode.label}
            >
              <Icon size={18} className={`mx-auto ${isActive ? 'text-white' : mode.color}`} />
            </button>
          )
        })}
      </div>

      {/* Управление вентилятором */}
      {hasFanControl && isOn && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-dark-textSecondary">Вентилятор</span>
            <span className="text-xs font-medium text-white">{fanMode.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {availableFanModes.map((fm: string) => (
              <button
                key={fm}
                onClick={() => handleSetFanMode(fm)}
                disabled={isLoading}
                className={`flex-1 min-w-[50px] px-1.5 py-1 rounded text-xs transition-all truncate ${
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

const ACWidget = () => {
  const [acConfigs, setACConfigs] = useState<ACConfig[]>([])
  const { api } = useHomeAssistant()
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfigs = () => {
      const configs = getACConfigsSync()
      console.log('ACWidget: загружены конфигурации:', configs)
      setACConfigs(configs)
    }

    loadConfigs()

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

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className={`grid gap-4 ${
        acConfigs.length === 1 
          ? 'grid-cols-1' 
          : acConfigs.length === 2 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {Array.isArray(acConfigs) && acConfigs.map((acConfig, index) => (
          <ACUnit
            key={acConfig.entityId || index}
            acConfig={acConfig}
            entity={acConfig.entityId ? entities.get(acConfig.entityId) || null : null}
            api={api}
            loading={loading}
            onLoadingChange={setLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default ACWidget
