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

export interface WidgetConfig {
  ambientLighting: {
    lights: LightConfig[]
  }
  ac: {
    entityId: string | null
    name: string
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
    entityId: null,
    name: 'Кондиционер'
  }
}

const STORAGE_KEY = 'widget_config'

export const getWidgetConfig = (): WidgetConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
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

export const updateACConfig = (acConfig: ACConfig): void => {
  const config = getWidgetConfig()
  config.ac = acConfig
  saveWidgetConfig(config)
}

export const getACConfig = (): ACConfig => {
  const config = getWidgetConfig()
  return config.ac || DEFAULT_CONFIG.ac
}
