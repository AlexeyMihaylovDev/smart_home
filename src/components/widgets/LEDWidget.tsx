import { useState, useEffect, useRef, useCallback } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getLEDConfigsSync, LEDConfig, getLEDStyleSync, LEDStyle } from '../../services/widgetConfig'
import {
  PreparedLED,
  LEDListStyle,
  LEDCardStyle,
  LEDCompactStyle,
  LEDModernStyle,
  LEDListNotConfigured,
  LEDCardNotConfigured,
  LEDCompactNotConfigured,
  LEDModernNotConfigured,
} from './LEDStyles'

interface LEDUnitProps {
  ledConfig: LEDConfig
  entity: Entity | null
  api: any
  loading: boolean
  onLoadingChange: (loading: boolean) => void
}

const LEDUnit = ({ ledConfig, entity, api, loading, onLoadingChange }: LEDUnitProps) => {
  const [localLoading, setLocalLoading] = useState(false)
  const [brightness, setBrightness] = useState<number>(0)
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 })
  const [showColorPicker, setShowColorPicker] = useState(false)
  const brightnessTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDraggingRef = useRef(false)
  const currentBrightnessRef = useRef<number>(0)

  useEffect(() => {
    if (entity) {
      const brightnessLevel = entity.attributes.brightness
      if (typeof brightnessLevel === 'number') {
        // Home Assistant использует 0-255 для brightness
        const brightnessPercent = Math.round((brightnessLevel / 255) * 100)
        setBrightness(brightnessPercent)
        currentBrightnessRef.current = brightnessPercent
      }
      
      // Получаем RGB цвет, если доступен
      if (entity.attributes.rgb_color && Array.isArray(entity.attributes.rgb_color)) {
        const [r, g, b] = entity.attributes.rgb_color
        setRgbColor({ r, g, b })
      } else if (entity.attributes.color_name) {
        // Если есть цвет по имени, можно попробовать преобразовать
        // Пока оставляем белый по умолчанию
      }
    }
  }, [entity])

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (brightnessTimeoutRef.current) {
        clearTimeout(brightnessTimeoutRef.current)
      }
    }
  }, [])

  const isOn = entity?.state === 'on'
  const friendlyName = ledConfig.name || entity?.attributes.friendly_name || ledConfig.entityId || 'LED'

  const handlePower = async () => {
    if (!api || !ledConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      if (isOn) {
        await api.turnOff(ledConfig.entityId)
      } else {
        await api.turnOn(ledConfig.entityId)
      }
    } catch (error) {
      console.error('Ошибка управления питанием:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const applyBrightnessChange = useCallback(async (newBrightness: number) => {
    if (!api || !ledConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      // Преобразуем процент в значение 0-255 для Home Assistant
      const brightnessValue = Math.round((newBrightness / 100) * 255)
      
      await api.callService({
        domain: 'light',
        service: 'turn_on',
        target: { entity_id: ledConfig.entityId },
        service_data: { brightness: brightnessValue }
      })
    } catch (error) {
      console.error('Ошибка изменения яркости:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }, [api, ledConfig.entityId, onLoadingChange])

  const handleBrightnessChange = useCallback((newBrightness: number) => {
    const clampedBrightness = Math.max(0, Math.min(100, newBrightness))
    setBrightness(clampedBrightness)
    currentBrightnessRef.current = clampedBrightness

    // Очищаем предыдущий таймер
    if (brightnessTimeoutRef.current) {
      clearTimeout(brightnessTimeoutRef.current)
    }

    // Если пользователь перетаскивает, используем debounce
    if (isDraggingRef.current) {
      brightnessTimeoutRef.current = setTimeout(() => {
        applyBrightnessChange(currentBrightnessRef.current)
      }, 150) // 150ms задержка при перетаскивании
    } else {
      // Если это одиночное изменение, применяем сразу
      applyBrightnessChange(clampedBrightness)
    }
  }, [applyBrightnessChange])

  const handleBrightnessMouseDown = useCallback(() => {
    isDraggingRef.current = true
  }, [])

  const handleBrightnessMouseUp = useCallback(() => {
    isDraggingRef.current = false
    // Применяем финальное значение сразу при отпускании
    if (brightnessTimeoutRef.current) {
      clearTimeout(brightnessTimeoutRef.current)
      brightnessTimeoutRef.current = null
    }
    // Используем ref для получения актуального значения
    applyBrightnessChange(currentBrightnessRef.current)
  }, [applyBrightnessChange])

  const handleColorChange = async (color: { r: number; g: number; b: number }) => {
    if (!api || !ledConfig.entityId || ledConfig.type !== 'rgb') return

    setRgbColor(color)

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'light',
        service: 'turn_on',
        target: { entity_id: ledConfig.entityId },
        service_data: { 
          rgb_color: [color.r, color.g, color.b],
          brightness: Math.round((brightness / 100) * 255)
        }
      })
    } catch (error) {
      console.error('Ошибка изменения цвета:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  if (!entity) {
    return (
      <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
        <div className="text-center text-dark-textSecondary">
          <div className="text-sm mb-1">{friendlyName}</div>
          <div className="text-xs">לא מחובר</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-blue-500/50 transition-all">
      {/* Заголовок с питанием */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 ${isOn ? 'bg-yellow-500/20' : 'bg-gray-500/20'}`}>
            <Lightbulb size={18} className={`${isOn ? 'text-yellow-400' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm sm:text-base text-white truncate" title={friendlyName}>
              {friendlyName}
            </div>
            <div className="text-[10px] sm:text-xs text-dark-textSecondary">
              {ledConfig.type === 'rgb' ? 'RGB' : 'Dimmer'}
            </div>
          </div>
        </div>
        <button
          onClick={handlePower}
          disabled={localLoading || loading}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 ${
            isOn 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isOn ? 'כבה' : 'הדלק'}
        >
          <Power size={16} />
        </button>
      </div>

      {isOn && (
        <div className="space-y-3 sm:space-y-4">
          {/* Ползунок яркости */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-yellow-400" />
                <span className="text-xs sm:text-sm text-white font-medium">בהירות</span>
              </div>
              <span className="text-xs sm:text-sm text-white font-medium w-12 text-right">
                {brightness}%
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                onMouseDown={handleBrightnessMouseDown}
                onMouseUp={handleBrightnessMouseUp}
                onTouchStart={handleBrightnessMouseDown}
                onTouchEnd={handleBrightnessMouseUp}
                disabled={localLoading || loading}
                className="w-full h-3 bg-dark-card rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed slider-brightness"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${brightness}%, #1a1a1a ${brightness}%, #1a1a1a 100%)`
                }}
              />
            </div>
          </div>

          {/* RGB Color Picker для RGB ламп */}
          {ledConfig.type === 'rgb' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-blue-400" />
                  <span className="text-xs sm:text-sm text-white font-medium">צבע</span>
                </div>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="px-2 py-1 rounded-lg bg-dark-card hover:bg-dark-cardHover transition-colors text-xs"
                >
                  {showColorPicker ? 'הסתר' : 'בחר צבע'}
                </button>
              </div>
              
              {/* Текущий цвет */}
              <div 
                className="w-full h-12 rounded-lg border-2 border-dark-border cursor-pointer transition-all hover:border-blue-500"
                style={{ backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />

              {/* Color Picker */}
              {showColorPicker && (
                <div className="p-3 bg-dark-card rounded-lg border border-dark-border space-y-3">
                  {/* Ползунки RGB */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-red-400 font-medium">R</span>
                      <span className="text-xs text-white">{rgbColor.r}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgbColor.r}
                      onChange={(e) => handleColorChange({ ...rgbColor, r: Number(e.target.value) })}
                      disabled={localLoading || loading}
                      className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-50 slider-rgb"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(rgbColor.r / 255) * 100}%, #1a1a1a ${(rgbColor.r / 255) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-400 font-medium">G</span>
                      <span className="text-xs text-white">{rgbColor.g}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgbColor.g}
                      onChange={(e) => handleColorChange({ ...rgbColor, g: Number(e.target.value) })}
                      disabled={localLoading || loading}
                      className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-green-500 disabled:opacity-50 slider-rgb"
                      style={{
                        background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(rgbColor.g / 255) * 100}%, #1a1a1a ${(rgbColor.g / 255) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-400 font-medium">B</span>
                      <span className="text-xs text-white">{rgbColor.b}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgbColor.b}
                      onChange={(e) => handleColorChange({ ...rgbColor, b: Number(e.target.value) })}
                      disabled={localLoading || loading}
                      className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50 slider-rgb"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(rgbColor.b / 255) * 100}%, #1a1a1a ${(rgbColor.b / 255) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                  </div>

                  {/* Предустановленные цвета */}
                  <div className="grid grid-cols-6 gap-2 pt-2 border-t border-dark-border">
                    {[
                      { r: 255, g: 255, b: 255, name: 'White' },
                      { r: 255, g: 0, b: 0, name: 'Red' },
                      { r: 0, g: 255, b: 0, name: 'Green' },
                      { r: 0, g: 0, b: 255, name: 'Blue' },
                      { r: 255, g: 255, b: 0, name: 'Yellow' },
                      { r: 255, g: 0, b: 255, name: 'Magenta' },
                      { r: 0, g: 255, b: 255, name: 'Cyan' },
                      { r: 255, g: 165, b: 0, name: 'Orange' },
                      { r: 128, g: 0, b: 128, name: 'Purple' },
                      { r: 255, g: 192, b: 203, name: 'Pink' },
                      { r: 255, g: 20, b: 147, name: 'Deep Pink' },
                      { r: 0, g: 0, b: 0, name: 'Off' }
                    ].map((color, index) => (
                      <button
                        key={index}
                        onClick={() => handleColorChange({ r: color.r, g: color.g, b: color.b })}
                        disabled={localLoading || loading}
                        className="w-full h-8 rounded border-2 border-dark-border hover:border-blue-500 transition-all disabled:opacity-50"
                        style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const LEDWidget = () => {
  const { api } = useHomeAssistant()
  const [ledConfigs, setLEDConfigs] = useState<LEDConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)
  const [style, setStyle] = useState<LEDStyle>('list')
  const [localBrightness, setLocalBrightness] = useState<Map<string, number>>(new Map())
  const brightnessTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const isDraggingRef = useRef<Map<string, boolean>>(new Map())

  useEffect(() => {
    const loadConfigs = () => {
      const configs = getLEDConfigsSync()
      setLEDConfigs(configs)
      const widgetStyle = getLEDStyleSync()
      setStyle(widgetStyle)
    }

    loadConfigs()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config') {
        loadConfigs()
      }
    }

    const handleWidgetsChanged = () => {
      loadConfigs()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
      // Очистка всех таймеров
      brightnessTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      brightnessTimeoutsRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (api && ledConfigs.length > 0) {
      loadEntities()
      const interval = setInterval(loadEntities, 2000)
      return () => clearInterval(interval)
    }
  }, [api, ledConfigs])

  const loadEntities = async () => {
    if (!api || ledConfigs.length === 0) return

    try {
      const entityIds = ledConfigs
        .map(led => led.entityId)
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
          // Очищаем локальное значение brightness при обновлении из API
          setLocalBrightness(prev => {
            const newMap = new Map(prev)
            newMap.delete(id)
            return newMap
          })
        }
      })

      setEntities(newEntities)
    } catch (error) {
      console.error('Ошибка загрузки состояний LED:', error)
    }
  }

  const handlePowerToggle = async (led: PreparedLED) => {
    if (!api || !led.hasEntity) return

    const ledConfig = ledConfigs.find(c => (c.entityId || '') === led.id || c.name === led.name)
    if (!ledConfig?.entityId) return

    setLoading(true)
    try {
      const entity = entities.get(ledConfig.entityId)
      const isOn = entity?.state === 'on'
      
      if (isOn) {
        await api.turnOff(ledConfig.entityId)
      } else {
        await api.turnOn(ledConfig.entityId)
      }
    } catch (error) {
      console.error('Ошибка управления питанием:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyBrightnessChange = async (led: PreparedLED, brightness: number) => {
    if (!api || !led.hasEntity) return

    const ledConfig = ledConfigs.find(c => (c.entityId || '') === led.id || c.name === led.name)
    if (!ledConfig?.entityId) return

    setLoading(true)
    try {
      const brightnessValue = Math.round((brightness / 100) * 255)
      await api.callService({
        domain: 'light',
        service: 'turn_on',
        target: { entity_id: ledConfig.entityId },
        service_data: { brightness: brightnessValue }
      })
    } catch (error) {
      console.error('Ошибка изменения яркости:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBrightnessChange = (led: PreparedLED, newBrightness: number) => {
    const clampedBrightness = Math.max(0, Math.min(100, newBrightness))
    const ledId = led.id

    // Обновляем локальное состояние для немедленного отображения
    setLocalBrightness(prev => {
      const newMap = new Map(prev)
      newMap.set(ledId, clampedBrightness)
      return newMap
    })

    // Очищаем предыдущий таймер для этой лампы
    const existingTimeout = brightnessTimeoutsRef.current.get(ledId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Если пользователь перетаскивает, используем debounce
    if (isDraggingRef.current.get(ledId)) {
      const timeout = setTimeout(() => {
        applyBrightnessChange(led, clampedBrightness)
        brightnessTimeoutsRef.current.delete(ledId)
      }, 150)
      brightnessTimeoutsRef.current.set(ledId, timeout)
    } else {
      // Если это одиночное изменение, применяем сразу
      applyBrightnessChange(led, clampedBrightness)
    }
  }

  const handleBrightnessMouseDown = (led: PreparedLED) => {
    isDraggingRef.current.set(led.id, true)
  }

  const handleBrightnessMouseUp = (led: PreparedLED) => {
    isDraggingRef.current.set(led.id, false)
    // Применяем финальное значение сразу при отпускании
    const existingTimeout = brightnessTimeoutsRef.current.get(led.id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      brightnessTimeoutsRef.current.delete(led.id)
    }
    // Используем текущее значение brightness из preparedLEDs
    const currentLED = preparedLEDs.find(l => l.id === led.id)
    if (currentLED) {
      applyBrightnessChange(currentLED, currentLED.brightness)
    }
  }

  const handleColorChange = async (led: PreparedLED, color: { r: number; g: number; b: number }) => {
    if (!api || !led.hasEntity || led.type !== 'rgb') return

    const ledConfig = ledConfigs.find(c => (c.entityId || '') === led.id || c.name === led.name)
    if (!ledConfig?.entityId) return

    setLoading(true)
    try {
      const entity = entities.get(ledConfig.entityId)
      const brightness = entity?.attributes.brightness
      const brightnessValue = typeof brightness === 'number' ? Math.round((brightness / 255) * 100) : 50

      await api.callService({
        domain: 'light',
        service: 'turn_on',
        target: { entity_id: ledConfig.entityId },
        service_data: { 
          rgb_color: [color.r, color.g, color.b],
          brightness: Math.round((brightnessValue / 100) * 255)
        }
      })
    } catch (error) {
      console.error('Ошибка изменения цвета:', error)
    } finally {
      setLoading(false)
    }
  }

  // Преобразуем конфигурации в PreparedLED
  const preparedLEDs: PreparedLED[] = ledConfigs.map((ledConfig, index) => {
    const entity = ledConfig.entityId ? entities.get(ledConfig.entityId) || null : null
    const isOn = entity?.state === 'on'
    const ledId = ledConfig.entityId || `led-${index}`
    
    let brightness = 0
    let rgbColor = { r: 255, g: 255, b: 255 }
    
    if (entity) {
      const brightnessLevel = entity.attributes.brightness
      if (typeof brightnessLevel === 'number') {
        brightness = Math.round((brightnessLevel / 255) * 100)
      }
      
      if (entity.attributes.rgb_color && Array.isArray(entity.attributes.rgb_color)) {
        const [r, g, b] = entity.attributes.rgb_color
        rgbColor = { r, g, b }
      }
    }

    // Используем локальное значение brightness, если оно есть
    const localBrightnessValue = localBrightness.get(ledId)
    if (localBrightnessValue !== undefined) {
      brightness = localBrightnessValue
    }

    return {
      id: ledId,
      name: ledConfig.name || `LED ${index + 1}`,
      type: ledConfig.type,
      isOn,
      brightness,
      rgbColor,
      hasEntity: ledConfig.entityId !== null,
      controlsDisabled: false
    }
  })

  const renderStyle = () => {
    if (preparedLEDs.length === 0) {
      switch (style) {
        case 'card':
          return <LEDCardNotConfigured />
        case 'compact':
          return <LEDCompactNotConfigured />
        case 'modern':
          return <LEDModernNotConfigured />
        case 'list':
        default:
          return <LEDListNotConfigured />
      }
    }

    const props = {
      leds: preparedLEDs,
      onPowerToggle: handlePowerToggle,
      onBrightnessChange: handleBrightnessChange,
      onBrightnessMouseDown: handleBrightnessMouseDown,
      onBrightnessMouseUp: handleBrightnessMouseUp,
      onColorChange: handleColorChange
    }

    switch (style) {
      case 'card':
        return <LEDCardStyle {...props} />
      case 'compact':
        return <LEDCompactStyle {...props} />
      case 'modern':
        return <LEDModernStyle {...props} />
      case 'list':
      default:
        return <LEDListStyle {...props} />
    }
  }

  return (
    <div className="h-full p-2 sm:p-3 md:p-4 overflow-y-auto">
      {renderStyle()}
    </div>
  )
}

export default LEDWidget

