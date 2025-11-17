// Сервис для управления конфигурацией виджетов
import { getWidgetConfig as getWidgetConfigFromAPI, saveWidgetConfig as saveWidgetConfigToAPI, WidgetConfig as APIWidgetConfig } from './apiService'

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
  style?: WaterHeaterStyle
}

export type SensorsStyle = 'list' | 'card' | 'compact' | 'grid'

export interface SensorConfig {
  name: string
  entityId: string | null
  type: 'motion' | 'presence'
  powerType?: 'battery' | 'electric'
  batteryEntityId?: string | null
}

export type SensorsStyle = 'list' | 'card' | 'compact' | 'grid'
export type MotorsStyle = 'list' | 'card' | 'compact'

export interface MotorConfig {
  entityId: string | null
  name: string
}

export interface BoseConfig {
  entityId: string | null
  name: string
}

export interface VacuumConfig {
  entityId: string | null
  name: string
  mapEntityId?: string | null // Entity ID для карты (если отдельный) - для обратной совместимости
  mapEntityIds?: string[] // Массив Entity ID для карт (новый формат)
  // Дополнительные связанные entities с их типами
  relatedEntities?: Array<{
    entityId: string
    type: 'map' | 'sensor' | 'camera' | 'image' | 'other'
    name?: string // Отображаемое имя
  }>
}

export interface CameraConfig {
  entityId: string | null
  name: string
}

export type AmbientLightingStyle = 'list' | 'cards' | 'compact' | 'minimal'
export type WaterHeaterStyle = 'compact' | 'card' | 'minimal' | 'modern'
export type SensorsStyle = 'list' | 'card' | 'compact' | 'grid'
export type MotorsStyle = 'list' | 'card' | 'compact'
export type CamerasStyle = 'list' | 'card' | 'compact' | 'grid'

export interface SpotifyConfig {
  accountName: string
  trackName: string
  artistName: string
  deviceName: string
  coverEmoji: string
  isPlaying: boolean
  progress: number
}

export interface NavigationIcon {
  id: string
  label: string
  iconName: 'camera' | 'home' | 'network' | 'vacuum' | 'widget'
  enabled: boolean
  order: number
  widgetId?: string // ID виджета, если это виджет
  widgetType?: string // Тип виджета (ambient-lighting, tv-time, etc.)
  dashboardId?: string // ID dashboard (используется для идентификации dashboard)
  widgets?: string[] // Список ID виджетов, которые отображаются в этом dashboard
}

export interface WidgetConfig {
  ambientLighting: {
    lights: LightConfig[]
    style?: AmbientLightingStyle
  }
  ac: {
    airConditioners: ACConfig[]
  }
  waterHeater: WaterHeaterConfig
  sensors: {
    sensors: SensorConfig[]
    style?: SensorsStyle
  }
  motors: {
    motors: MotorConfig[]
    style?: MotorsStyle
  }
  spotify: SpotifyConfig
  bose: {
    soundbars: BoseConfig[]
  }
  vacuum: {
    vacuums: VacuumConfig[]
  }
  cameras: {
    cameras: CameraConfig[]
    style?: CamerasStyle
  }
  enabledWidgets: {
    [widgetId: string]: boolean
  }
  navigationIcons: {
    icons: NavigationIcon[]
  }
}

const DEFAULT_CONFIG: WidgetConfig = {
  ambientLighting: {
    style: 'list',
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
    name: 'Водонагреватель',
    style: 'compact'
  },
  sensors: {
    sensors: [],
    style: 'list'
  },
  motors: {
    motors: [],
    style: 'list'
  },
  spotify: {
    accountName: 'Spotify Heta Sanghvi',
    trackName: 'Arms',
    artistName: 'The Paper Kites',
    deviceName: 'Office',
    coverEmoji: '🎵',
    isPlaying: true,
    progress: 45
  },
  bose: {
    soundbars: []
  },
  vacuum: {
    vacuums: []
  },
  cameras: {
    cameras: [],
    style: 'grid'
  },
  enabledWidgets: {},
  navigationIcons: {
    icons: [
      { id: 'cameras', label: 'Cameras', iconName: 'camera', enabled: true, order: 0, dashboardId: 'cameras', widgets: [] },
      { id: 'home', label: 'Home', iconName: 'home', enabled: true, order: 1, dashboardId: 'home', widgets: [] },
      { id: 'network', label: 'Network', iconName: 'network', enabled: true, order: 2, dashboardId: 'network', widgets: [] },
      { id: 'vacuum', label: 'Vacuum', iconName: 'vacuum', enabled: true, order: 3, dashboardId: 'vacuum', widgets: [] },
    ]
  }
}

// Кэш для синхронного доступа (используется как fallback)
let configCache: WidgetConfig | null = null

export const getWidgetConfig = async (): Promise<WidgetConfig> => {
  try {
    const config = await getWidgetConfigFromAPI()
    // Убеждаемся, что структура правильная
    if (!config.ac || !config.ac.airConditioners) {
      if (config.ac && 'entityId' in config.ac) {
        // Старый формат - оставляем как есть для миграции
        configCache = config as WidgetConfig
        return config as WidgetConfig
      }
      config.ac = { airConditioners: [] }
    }
    // Инициализируем navigationIcons, если отсутствует
    if (!config.navigationIcons || !config.navigationIcons.icons) {
      config.navigationIcons = DEFAULT_CONFIG.navigationIcons
    }
    configCache = config as WidgetConfig
    return config as WidgetConfig
  } catch (error) {
    console.error('Ошибка загрузки конфигурации с сервера:', error)
    // Fallback на localStorage
    try {
      const stored = localStorage.getItem('widget_config')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!parsed.ac || !parsed.ac.airConditioners) {
          if (parsed.ac && 'entityId' in parsed.ac) {
            configCache = parsed
            return parsed
          }
          parsed.ac = { airConditioners: [] }
        }
        // Инициализируем navigationIcons, если отсутствует
        if (!parsed.navigationIcons || !parsed.navigationIcons.icons) {
          parsed.navigationIcons = DEFAULT_CONFIG.navigationIcons
        }
        configCache = parsed
        return parsed
      }
    } catch (localError) {
      console.error('Ошибка загрузки из localStorage:', localError)
    }
    return DEFAULT_CONFIG
  }
}

// Синхронная версия для обратной совместимости (использует кэш)
export const getWidgetConfigSync = (): WidgetConfig => {
  if (configCache) {
    // Убеждаемся, что navigationIcons инициализирован
    if (!configCache.navigationIcons || !configCache.navigationIcons.icons) {
      configCache.navigationIcons = DEFAULT_CONFIG.navigationIcons
    }
    return configCache
  }
  // Fallback на localStorage
  try {
    const stored = localStorage.getItem('widget_config')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (!parsed.ac || !parsed.ac.airConditioners) {
        if (parsed.ac && 'entityId' in parsed.ac) {
          return parsed
        }
        parsed.ac = { airConditioners: [] }
      }
      // Инициализируем navigationIcons, если отсутствует
      if (!parsed.navigationIcons || !parsed.navigationIcons.icons) {
        parsed.navigationIcons = DEFAULT_CONFIG.navigationIcons
      }
      configCache = parsed
      return parsed
    }
  } catch (error) {
    console.error('Ошибка загрузки конфигурации:', error)
  }
  return DEFAULT_CONFIG
}

export const saveWidgetConfig = async (config: WidgetConfig): Promise<void> => {
  try {
    await saveWidgetConfigToAPI(config as APIWidgetConfig)
    configCache = config
  } catch (error) {
    console.error('Ошибка сохранения конфигурации на сервер:', error)
    // Fallback на localStorage
    try {
      localStorage.setItem('widget_config', JSON.stringify(config))
      configCache = config
    } catch (localError) {
      console.error('Ошибка сохранения в localStorage:', localError)
    }
  }
}

export const updateAmbientLightingConfig = async (lights: LightConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  config.ambientLighting.lights = lights
  await saveWidgetConfig(config)
}

export const getAmbientLightingConfig = async (): Promise<LightConfig[]> => {
  const config = await getWidgetConfig()
  return config.ambientLighting.lights
}

// Синхронная версия для обратной совместимости
export const getAmbientLightingConfigSync = (): LightConfig[] => {
  const config = getWidgetConfigSync()
  return config.ambientLighting.lights
}

export const getAmbientLightingStyle = async (): Promise<AmbientLightingStyle> => {
  const config = await getWidgetConfig()
  return config.ambientLighting.style || 'list'
}

export const getAmbientLightingStyleSync = (): AmbientLightingStyle => {
  const config = getWidgetConfigSync()
  return config.ambientLighting.style || 'list'
}

export const updateAmbientLightingStyle = async (style: AmbientLightingStyle): Promise<void> => {
  const config = await getWidgetConfig()
  config.ambientLighting.style = style
  await saveWidgetConfig(config)
}

export const updateACConfigs = async (airConditioners: ACConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
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
  
  await saveWidgetConfig(config)
  
  // Проверяем, что сохранилось правильно
  const saved = await getWidgetConfig()
  console.log('updateACConfigs: проверка сохраненной конфигурации:', saved)
  console.log('updateACConfigs: сохраненные AC конфигурации:', saved.ac?.airConditioners)
  
  console.log('AC конфигурация сохранена:', airConditioners)
}

export const getACConfigs = async (): Promise<ACConfig[]> => {
  const config = await getWidgetConfig()
  console.log('getACConfigs: полная конфигурация с сервера:', config)
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

// Синхронная версия для обратной совместимости
export const getACConfigsSync = (): ACConfig[] => {
  const config = getWidgetConfigSync()
  if (config.ac && 'airConditioners' in config.ac && Array.isArray(config.ac.airConditioners)) {
    return config.ac.airConditioners
  }
  if (config.ac && 'entityId' in config.ac && !('airConditioners' in config.ac)) {
    const oldConfig = config.ac as any
    if (oldConfig.entityId) {
      return [{
        entityId: oldConfig.entityId,
        name: oldConfig.name || 'Кондиционер'
      }]
    }
    return []
  }
  return config.ac?.airConditioners || []
}

export const isWidgetEnabled = async (widgetId: string): Promise<boolean> => {
  const config = await getWidgetConfig()
  return config.enabledWidgets?.[widgetId] === true
}

export const isWidgetEnabledSync = (widgetId: string): boolean => {
  const config = getWidgetConfigSync()
  return config.enabledWidgets?.[widgetId] === true
}

export const setWidgetEnabled = async (widgetId: string, enabled: boolean): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.enabledWidgets) {
    config.enabledWidgets = {}
  }
  config.enabledWidgets[widgetId] = enabled
  await saveWidgetConfig(config)
}

export const getWaterHeaterConfig = async (): Promise<WaterHeaterConfig> => {
  const config = await getWidgetConfig()
  return config.waterHeater || { entityId: null, name: 'Водонагреватель', style: 'compact' }
}

export const getWaterHeaterConfigSync = (): WaterHeaterConfig => {
  const config = getWidgetConfigSync()
  return config.waterHeater || { entityId: null, name: 'Водонагреватель', style: 'compact' }
}

export const updateWaterHeaterConfig = async (waterHeaterConfig: WaterHeaterConfig): Promise<void> => {
  const config = await getWidgetConfig()
  config.waterHeater = waterHeaterConfig
  await saveWidgetConfig(config)
}

export const getWaterHeaterStyleSync = (): WaterHeaterStyle => {
  const config = getWaterHeaterConfigSync()
  return config.style || 'compact'
}

export const updateWaterHeaterStyle = async (style: WaterHeaterStyle): Promise<void> => {
  const config = await getWaterHeaterConfig()
  config.style = style
  await updateWaterHeaterConfig(config)
}

export const getSensorsConfig = async (): Promise<SensorConfig[]> => {
  const config = await getWidgetConfig()
  return config.sensors?.sensors || []
}

export const getSensorsConfigSync = (): SensorConfig[] => {
  const config = getWidgetConfigSync()
  return config.sensors?.sensors || []
}

export const updateSensorsConfig = async (sensors: SensorConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.sensors) {
    config.sensors = { sensors: [], style: 'list' }
  }
  config.sensors.sensors = sensors
  await saveWidgetConfig(config)
}

export const getSensorsStyleSync = (): SensorsStyle => {
  const config = getWidgetConfigSync()
  return config.sensors?.style || 'list'
}

export const updateSensorsStyle = async (style: SensorsStyle): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.sensors) {
    config.sensors = { sensors: [], style }
  } else {
    config.sensors.style = style
  }
  await saveWidgetConfig(config)
}

export const getAllEnabledWidgets = async (): Promise<string[]> => {
  const config = await getWidgetConfig()
  if (!config.enabledWidgets) {
    return []
  }
  return Object.keys(config.enabledWidgets).filter(id => config.enabledWidgets[id] === true)
}

export const getAllEnabledWidgetsSync = (): string[] => {
  const config = getWidgetConfigSync()
  if (!config.enabledWidgets) {
    return []
  }
  return Object.keys(config.enabledWidgets).filter(id => config.enabledWidgets[id] === true)
}

export const getMotorConfigs = async (): Promise<MotorConfig[]> => {
  const config = await getWidgetConfig()
  return config.motors?.motors || []
}

export const getMotorConfigsSync = (): MotorConfig[] => {
  const config = getWidgetConfigSync()
  return config.motors?.motors || []
}

export const updateMotorConfigs = async (motors: MotorConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.motors) {
    config.motors = { motors: [], style: 'list' }
  }
  config.motors.motors = motors
  await saveWidgetConfig(config)
}

export const getMotorsStyleSync = (): MotorsStyle => {
  const config = getWidgetConfigSync()
  return config.motors?.style || 'list'
}

export const updateMotorsStyle = async (style: MotorsStyle): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.motors) {
    config.motors = { motors: [], style }
  } else {
    config.motors.style = style
  }
  await saveWidgetConfig(config)
}

export const getSpotifyConfig = async (): Promise<SpotifyConfig> => {
  const config = await getWidgetConfig()
  return config.spotify || DEFAULT_CONFIG.spotify
}

export const getSpotifyConfigSync = (): SpotifyConfig => {
  const config = getWidgetConfigSync()
  return config.spotify || DEFAULT_CONFIG.spotify
}

export const updateSpotifyConfig = async (spotifyConfig: SpotifyConfig): Promise<void> => {
  const config = await getWidgetConfig()
  config.spotify = spotifyConfig
  await saveWidgetConfig(config)
}

export const getBoseConfigs = async (): Promise<BoseConfig[]> => {
  const config = await getWidgetConfig()
  return config.bose?.soundbars || []
}

export const getBoseConfigsSync = (): BoseConfig[] => {
  const config = getWidgetConfigSync()
  return config.bose?.soundbars || []
}

export const updateBoseConfigs = async (soundbars: BoseConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.bose) {
    config.bose = { soundbars: [] }
  }
  config.bose.soundbars = soundbars
  await saveWidgetConfig(config)
}

export const getVacuumConfigs = async (): Promise<VacuumConfig[]> => {
  const config = await getWidgetConfig()
  return config.vacuum?.vacuums || []
}

export const getVacuumConfigsSync = (): VacuumConfig[] => {
  const config = getWidgetConfigSync()
  return config.vacuum?.vacuums || []
}

export const updateVacuumConfigs = async (vacuums: VacuumConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.vacuum) {
    config.vacuum = { vacuums: [] }
  }
  config.vacuum.vacuums = vacuums
  await saveWidgetConfig(config)
}

export const getNavigationIcons = async (): Promise<NavigationIcon[]> => {
  const config = await getWidgetConfig()
  return config.navigationIcons?.icons || []
}

export const getNavigationIconsSync = (): NavigationIcon[] => {
  const config = getWidgetConfigSync()
  return config.navigationIcons?.icons || []
}

export const updateNavigationIcons = async (icons: NavigationIcon[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.navigationIcons) {
    config.navigationIcons = { icons: [] }
  }
  config.navigationIcons.icons = icons
  await saveWidgetConfig(config)
}

export const getCameraConfigs = async (): Promise<CameraConfig[]> => {
  const config = await getWidgetConfig()
  return config.cameras?.cameras || []
}

export const getCameraConfigsSync = (): CameraConfig[] => {
  const config = getWidgetConfigSync()
  return config.cameras?.cameras || []
}

export const updateCameraConfigs = async (cameras: CameraConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.cameras) {
    config.cameras = { cameras: [], style: 'grid' }
  }
  config.cameras.cameras = cameras
  await saveWidgetConfig(config)
}

export const getCamerasStyleSync = (): CamerasStyle => {
  const config = getWidgetConfigSync()
  return config.cameras?.style || 'grid'
}

export const updateCamerasStyle = async (style: CamerasStyle): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.cameras) {
    config.cameras = { cameras: [], style }
  } else {
    config.cameras.style = style
  }
  await saveWidgetConfig(config)
}
