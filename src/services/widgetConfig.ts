// Сервис для управления конфигурацией виджетов

export interface LightConfig {
  name: string
  entityId: string | null
  icon: 'clock' | 'lightbulb'
}

export interface ACConfig {
  entityId: string | null
  name: string
}

export interface WaterHeaterConfig {
  entityId: string | null
  name: string
}

export interface WidgetConfig {
  ambientLighting: {
    lights: LightConfig[]
  }
  ac: {
    airConditioners: ACConfig[]
  }
  waterHeater: WaterHeaterConfig
  enabledWidgets: {
    [widgetId: string]: boolean
  }
}

const DEFAULT_CONFIG: WidgetConfig = {
  ambientLighting: {
    lights: [
      { name: 'Clock Light', entityId: null, icon: 'clock' },
      { name: 'TV Ambilight', entityId: null, icon: 'lightbulb' },
      { name: 'TV Ambilight Hyperion', entityId: null, icon: 'lightbulb' },
      { name: 'Downstairs Lights', entityId: null, icon: 'lightbulb' },
      { name: 'Interior Lights', entityId: null, icon: 'lightbulb' },
      { name: 'Bonus Room Lights', entityId: null, icon: 'lightbulb' },
    ]
  },
  ac: {
    airConditioners: []
  },
  waterHeater: {
    entityId: null,
    name: 'Водонагреватель'
  },
  enabledWidgets: {}
}

const STORAGE_KEY = 'widget_config'

export const getWidgetConfig = (): WidgetConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Убеждаемся, что структура правильная
      if (!parsed.ac || !parsed.ac.airConditioners) {
        // Если структура неправильная, исправляем её
        if (parsed.ac && 'entityId' in parsed.ac) {
          // Старый формат - оставляем как есть для миграции
          return parsed
        }
        // Если ac отсутствует или неправильный формат, добавляем правильную структуру
        parsed.ac = { airConditioners: [] }
      }
      return parsed
    }
  } catch (error) {
    console.error('Ошибка загрузки конфигурации:', error)
  }
  return DEFAULT_CONFIG
}

export const saveWidgetConfig = (config: WidgetConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Ошибка сохранения конфигурации:', error)
  }
}

export const updateAmbientLightingConfig = (lights: LightConfig[]): void => {
  const config = getWidgetConfig()
  config.ambientLighting.lights = lights
  saveWidgetConfig(config)
}

export const getAmbientLightingConfig = (): LightConfig[] => {
  const config = getWidgetConfig()
  return config.ambientLighting.lights
}

export const updateACConfigs = (airConditioners: ACConfig[]): void => {
  const config = getWidgetConfig()
  console.log('updateACConfigs: текущая конфигурация перед сохранением:', config)
  
  // Убеждаемся, что структура правильная
  if (!config.ac) {
    config.ac = { airConditioners: [] }
  }
  
  // Удаляем старый формат, если он есть
  if ('entityId' in config.ac) {
    delete (config.ac as any).entityId
    delete (config.ac as any).name
  }
  
  // Устанавливаем новый формат
  config.ac.airConditioners = airConditioners
  
  console.log('updateACConfigs: конфигурация после обновления:', config)
  console.log('updateACConfigs: config.ac:', config.ac)
  console.log('updateACConfigs: config.ac.airConditioners:', config.ac.airConditioners)
  
  saveWidgetConfig(config)
  
  // Проверяем, что сохранилось правильно
  const saved = getWidgetConfig()
  console.log('updateACConfigs: проверка сохраненной конфигурации:', saved)
  console.log('updateACConfigs: сохраненные AC конфигурации:', saved.ac?.airConditioners)
  
  console.log('AC конфигурация сохранена:', airConditioners)
}

export const getACConfigs = (): ACConfig[] => {
  const config = getWidgetConfig()
  console.log('getACConfigs: полная конфигурация из localStorage:', config)
  console.log('getACConfigs: config.ac:', config.ac)
  
  // Проверяем наличие нового формата (airConditioners)
  if (config.ac && 'airConditioners' in config.ac && Array.isArray(config.ac.airConditioners)) {
    const result = config.ac.airConditioners
    console.log('AC конфигурация загружена (новый формат):', result)
    return result
  }
  
  // Поддержка старого формата для миграции
  if (config.ac && 'entityId' in config.ac && !('airConditioners' in config.ac)) {
    const oldConfig = config.ac as any
    if (oldConfig.entityId) {
      console.log('AC конфигурация загружена (старый формат, миграция):', [{
        entityId: oldConfig.entityId,
        name: oldConfig.name || 'Кондиционер'
      }])
      return [{
        entityId: oldConfig.entityId,
        name: oldConfig.name || 'Кондиционер'
      }]
    }
    return []
  }
  
  // Если структура неправильная или отсутствует
  const result = config.ac?.airConditioners || []
  console.log('AC конфигурация загружена (fallback):', result)
  return result
}

export const isWidgetEnabled = (widgetId: string): boolean => {
  const config = getWidgetConfig()
  return config.enabledWidgets?.[widgetId] === true
}

export const setWidgetEnabled = (widgetId: string, enabled: boolean): void => {
  const config = getWidgetConfig()
  if (!config.enabledWidgets) {
    config.enabledWidgets = {}
  }
  config.enabledWidgets[widgetId] = enabled
  saveWidgetConfig(config)
}

export const getWaterHeaterConfig = (): WaterHeaterConfig => {
  const config = getWidgetConfig()
  return config.waterHeater || { entityId: null, name: 'Водонагреватель' }
}

export const updateWaterHeaterConfig = (waterHeaterConfig: WaterHeaterConfig): void => {
  const config = getWidgetConfig()
  config.waterHeater = waterHeaterConfig
  saveWidgetConfig(config)
}

export const getAllEnabledWidgets = (): string[] => {
  const config = getWidgetConfig()
  if (!config.enabledWidgets) {
    return []
  }
  return Object.keys(config.enabledWidgets).filter(id => config.enabledWidgets[id] === true)
}
