import { useState, useEffect, useRef } from 'react'
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

const LEDWidget = () => {
  const { api } = useHomeAssistant()
  const [ledConfigs, setLEDConfigs] = useState<LEDConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [_loading, setLoading] = useState(false)
  const [style, setStyle] = useState<LEDStyle>('list')
  const [localBrightness, setLocalBrightness] = useState<Map<string, number>>(new Map())
  const brightnessTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const isDraggingRef = useRef<Map<string, boolean>>(new Map())
  const pendingBrightnessRef = useRef<Map<string, number>>(new Map())

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
      const interval = setInterval(loadEntities, 5000)
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

          // Получаем текущее значение brightness из API
          const brightnessLevel = state.attributes.brightness
          const apiBrightness = typeof brightnessLevel === 'number'
            ? Math.round((brightnessLevel / 255) * 100)
            : 0

          // Проверяем, есть ли ожидаемое значение (изменение в процессе)
          const pendingBrightness = pendingBrightnessRef.current.get(id)
          const isDragging = isDraggingRef.current.get(id)

          // Не трогаем локальное значение, если пользователь сейчас перетаскивает
          if (!isDragging) {
            // Очищаем локальное значение только если:
            // 1. Нет ожидаемого значения (изменение не в процессе)
            // 2. Или значение из API совпадает с ожидаемым (с погрешностью ±2%)
            setLocalBrightness(prev => {
              const newMap = new Map(prev)
              const localValue = newMap.get(id)

              if (pendingBrightness !== undefined) {
                // Если есть ожидаемое значение, проверяем совпадение
                if (Math.abs(apiBrightness - pendingBrightness) <= 2) {
                  // Значение совпадает, можно очистить локальное
                  newMap.delete(id)
                  pendingBrightnessRef.current.delete(id)
                }
                // Если не совпадает, оставляем локальное значение
              } else if (localValue !== undefined) {
                // Если нет ожидаемого значения, но есть локальное
                // Проверяем, совпадает ли оно с API (с погрешностью ±2%)
                if (Math.abs(apiBrightness - localValue) <= 2) {
                  // Значение совпадает, очищаем локальное
                  newMap.delete(id)
                }
                // Если не совпадает, оставляем локальное (возможно, пользователь еще двигает)
              }

              return newMap
            })
          }
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

    const ledId = ledConfig.entityId
    // Сохраняем ожидаемое значение
    pendingBrightnessRef.current.set(ledId, brightness)

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
      // При ошибке удаляем ожидаемое значение
      pendingBrightnessRef.current.delete(ledId)
    } finally {
      setLoading(false)
      // Удаляем ожидаемое значение через небольшую задержку после успешного применения
      setTimeout(() => {
        pendingBrightnessRef.current.delete(ledId)
      }, 500)
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
    // Используем значение из локального состояния или из led (который уже содержит актуальное значение)
    const finalBrightness = localBrightness.get(led.id) ?? led.brightness
    applyBrightnessChange(led, finalBrightness)
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

