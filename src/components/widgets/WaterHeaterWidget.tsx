import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getWaterHeaterConfigSync, getWaterHeaterStyleSync, WaterHeaterStyle } from '../../services/widgetConfig'
import { CompactStyle, CardStyle, MinimalStyle, ModernStyle, CompactNotConfigured, CardNotConfigured, MinimalNotConfigured, ModernNotConfigured } from './WaterHeaterStyles'

const WaterHeaterWidget = () => {
  const [configEntityId, setConfigEntityId] = useState<string | null>(null)
  const { api } = useHomeAssistant()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(false)
  const [style, setStyle] = useState<WaterHeaterStyle>('compact')

  useEffect(() => {
    const loadConfig = () => {
      const config = getWaterHeaterConfigSync()
      setConfigEntityId(config.entityId)
      const widgetStyle = getWaterHeaterStyleSync()
      setStyle(widgetStyle)
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

  const config = getWaterHeaterConfigSync()

  if (!entity) {
    const friendlyName = config.name || 'Водонагреватель'
    const notConfiguredProps = { friendlyName }
    switch (style) {
      case 'card':
        return <CardNotConfigured {...notConfiguredProps} />
      case 'minimal':
        return <MinimalNotConfigured {...notConfiguredProps} />
      case 'modern':
        return <ModernNotConfigured {...notConfiguredProps} />
      case 'compact':
      default:
        return <CompactNotConfigured {...notConfiguredProps} />
    }
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

  const friendlyName = config.name || attrs.friendly_name || configEntityId?.split('.')[1] || 'Водонагреватель'

  const minTemp = attrs.min_temp || 20
  const maxTemp = attrs.max_temp || 80
  const tempStep = attrs.target_temp_step || 1

  const handleTempChange = (delta: number) => {
    const newTemp = Math.max(minTemp, Math.min(maxTemp, targetTemp + delta))
    handleSetTemperature(newTemp)
  }

  const styleProps = {
    friendlyName,
    currentTemp,
    targetTemp,
    isOn,
    loading,
    minTemp,
    maxTemp,
    tempStep,
    onTempChange: handleTempChange,
    onTurnOn: handleTurnOn,
    onTurnOff: handleTurnOff
  }

  const renderStyle = () => {
    switch (style) {
      case 'card':
        return <CardStyle {...styleProps} />
      case 'minimal':
        return <MinimalStyle {...styleProps} />
      case 'modern':
        return <ModernStyle {...styleProps} />
      case 'compact':
      default:
        return <CompactStyle {...styleProps} />
    }
  }

  return renderStyle()
}

export default WaterHeaterWidget

