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

export interface SensorConfig {
  name: string
  entityId: string | null
  type: 'motion' | 'presence'
  powerType?: 'battery' | 'electric'
  batteryEntityId?: string | null
}


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

export interface TVPreviewConfig {
  entityId: string | null
  name: string
}

export interface ClockConfig {
  name: string
  timezone?: string // Опционально: часовой пояс (например, 'Europe/Moscow', 'America/New_York')
  showSeconds?: boolean // Показывать секунды
  showDate?: boolean // Показывать дату
  showDayOfWeek?: boolean // Показывать день недели
  format24h?: boolean // 24-часовой формат
  style?: 'digital' | 'analog' | 'minimal' // Стиль отображения
}

export interface LEDConfig {
  entityId: string | null
  name: string
  type: 'rgb' | 'dimmer' // Тип лампы: RGB или простой dimmer
}

export type AmbientLightingStyle = 'list' | 'cards' | 'compact' | 'minimal'
export type WaterHeaterStyle = 'compact' | 'card' | 'minimal' | 'modern'
export type SensorsStyle = 'list' | 'card' | 'compact' | 'grid'
export type MotorsStyle = 'list' | 'card' | 'compact'
export type CamerasStyle = 'list' | 'card' | 'compact' | 'grid'
export type LEDStyle = 'list' | 'card' | 'compact' | 'modern'
export type ScenesStyle = 'grid' | 'list' | 'compact' | 'cards'

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
  tvPreview: {
    tvs: TVPreviewConfig[]
  }
  clock: ClockConfig
  led: {
    leds: LEDConfig[]
    style?: LEDStyle
  }
  scenes: {
    style?: ScenesStyle
    enabled: boolean
    hiddenScenes?: string[]
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
  tvPreview: {
    tvs: []
  },
  clock: {
    name: 'שעון',
    timezone: undefined,
    showSeconds: false,
    showDate: true,
    showDayOfWeek: true,
    format24h: true,
    style: 'digital'
  },
  led: {
    leds: [],
    style: 'list'
  },
  scenes: {
    style: 'grid',
    enabled: true
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

// Очистка кэша при смене пользователя
export const clearWidgetConfigCache = () => {
  configCache = null
}

// Слушаем событие смены пользователя
if (typeof window !== 'undefined') {
  window.addEventListener('user-changed', () => {
    clearWidgetConfigCache()
  })
}

export const getWidgetConfig = async (): Promise<WidgetConfig> => {
  try {
    console.log('[WidgetConfig] Загрузка конфигурации с сервера...')
    const config = await getWidgetConfigFromAPI()
    console.log('[WidgetConfig] Конфигурация загружена с сервера:', config)

    // Убеждаемся, что структура правильная
    if (!config.ac || !config.ac.airConditioners) {
      if (config.ac && 'entityId' in config.ac) {
        // Старый формат - оставляем как есть для миграции
        configCache = config as WidgetConfig
        // Сохраняем в localStorage как backup
        try {
          localStorage.setItem('widget_config', JSON.stringify(config))
        } catch (e) {
          console.warn('[WidgetConfig] Не удалось сохранить в localStorage:', e)
        }
        return config as WidgetConfig
      }
      config.ac = { airConditioners: [] }
    }
    // Инициализируем navigationIcons, если отсутствует
    if (!config.navigationIcons || !config.navigationIcons.icons) {
      config.navigationIcons = DEFAULT_CONFIG.navigationIcons
    }
    configCache = config as WidgetConfig
    // Сохраняем в localStorage как backup
    try {
      localStorage.setItem('widget_config', JSON.stringify(config))
      console.log('[WidgetConfig] Конфигурация сохранена в localStorage как backup')
    } catch (e) {
      console.warn('[WidgetConfig] Не удалось сохранить в localStorage:', e)
    }
    return config as WidgetConfig
  } catch (error) {
    console.error('[WidgetConfig] Ошибка загрузки конфигурации с сервера:', error)
    // Fallback на localStorage только если сервер недоступен
    try {
      const stored = localStorage.getItem('widget_config')
      if (stored) {
        console.log('[WidgetConfig] Используем конфигурацию из localStorage (fallback)')
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
      console.error('[WidgetConfig] Ошибка загрузки из localStorage:', localError)
    }
    console.warn('[WidgetConfig] Используем DEFAULT_CONFIG (сервер недоступен и localStorage пуст)')
    return DEFAULT_CONFIG
  }
}

// Синхронная версия для обратной совместимости (использует кэш)
// ВАЖНО: Эта функция не загружает с сервера! Используйте getWidgetConfig() для загрузки с сервера
export const getWidgetConfigSync = (): WidgetConfig => {
  if (configCache) {
    // Убеждаемся, что navigationIcons инициализирован
    if (!configCache.navigationIcons || !configCache.navigationIcons.icons) {
      configCache.navigationIcons = DEFAULT_CONFIG.navigationIcons
    }
    return configCache
  }
  // Fallback на localStorage (только если кэш пуст)
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
  } catch (error) {
    console.error('[WidgetConfig] Ошибка загрузки конфигурации из localStorage:', error)
  }
  return DEFAULT_CONFIG
}

// Функция для очистки объекта от циклических ссылок и несериализуемых свойств
const cleanConfigForSerialization = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // Если это DOM-элемент или React-компонент, пропускаем
  if (obj instanceof HTMLElement || obj instanceof Element || obj.constructor?.name === 'FiberNode') {
    return undefined
  }

  // Если это массив
  if (Array.isArray(obj)) {
    return obj.map(cleanConfigForSerialization).filter(item => item !== undefined)
  }

  // Если это объект
  const cleaned: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Пропускаем React-специфичные свойства
      if (key.startsWith('__react') || key.startsWith('__FIBER') || key === 'stateNode') {
        continue
      }

      try {
        const value = cleanConfigForSerialization(obj[key])
        if (value !== undefined) {
          cleaned[key] = value
        }
      } catch (e) {
        // Пропускаем свойства, которые не могут быть сериализованы
        continue
      }
    }
  }
  return cleaned
}

export const saveWidgetConfig = async (config: WidgetConfig): Promise<void> => {
  try {
    // Очищаем конфигурацию от циклических ссылок перед сохранением
    const cleanedConfig = cleanConfigForSerialization(config) as WidgetConfig

    console.log('[WidgetConfig] Сохранение конфигурации на сервер...', {
      ambientLighting: cleanedConfig.ambientLighting?.lights?.length || 0,
      ac: cleanedConfig.ac?.airConditioners?.length || 0,
      vacuum: cleanedConfig.vacuum?.vacuums?.length || 0,
      bose: cleanedConfig.bose?.soundbars?.length || 0,
      navigationIcons: cleanedConfig.navigationIcons?.icons?.length || 0,
      enabledWidgets: Object.keys(cleanedConfig.enabledWidgets || {}).length
    })
    // Всегда сохраняем на сервер в первую очередь
    await saveWidgetConfigToAPI(cleanedConfig as APIWidgetConfig)
    console.log('[WidgetConfig] Конфигурация успешно сохранена на сервер')
    configCache = cleanedConfig
    // Также сохраняем в localStorage как backup
    try {
      localStorage.setItem('widget_config', JSON.stringify(cleanedConfig))
      console.log('[WidgetConfig] Конфигурация сохранена в localStorage как backup')
    } catch (localError) {
      console.warn('[WidgetConfig] Не удалось сохранить в localStorage (backup):', localError)
    }
  } catch (error) {
    console.error('[WidgetConfig] Ошибка сохранения конфигурации на сервер:', error)
    // Fallback на localStorage только если сервер недоступен
    try {
      const cleanedConfig = cleanConfigForSerialization(config) as WidgetConfig
      localStorage.setItem('widget_config', JSON.stringify(cleanedConfig))
      configCache = cleanedConfig
      console.warn('[WidgetConfig] Конфигурация сохранена в localStorage как fallback')
    } catch (localError) {
      console.error('[WidgetConfig] Ошибка сохранения в localStorage:', localError)
      throw error // Пробрасываем ошибку дальше
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

// TV Preview Config functions
export const getTVPreviewConfigs = async (): Promise<TVPreviewConfig[]> => {
  const config = await getWidgetConfig()
  return config.tvPreview?.tvs || []
}

export const getTVPreviewConfigsSync = (): TVPreviewConfig[] => {
  const config = getWidgetConfigSync()
  return config.tvPreview?.tvs || []
}

export const updateTVPreviewConfigs = async (tvs: TVPreviewConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.tvPreview) {
    config.tvPreview = { tvs: [] }
  }
  config.tvPreview.tvs = tvs
  await saveWidgetConfig(config)
}

// Clock Config functions
export const getClockConfig = async (): Promise<ClockConfig> => {
  const config = await getWidgetConfig()
  return config.clock || DEFAULT_CONFIG.clock
}

export const getClockConfigSync = (): ClockConfig => {
  const config = getWidgetConfigSync()
  return config.clock || DEFAULT_CONFIG.clock
}

export const updateClockConfig = async (clockConfig: ClockConfig): Promise<void> => {
  const config = await getWidgetConfig()
  config.clock = clockConfig
  await saveWidgetConfig(config)
}

// LED Config functions
export const getLEDConfigs = async (): Promise<LEDConfig[]> => {
  const config = await getWidgetConfig()
  return config.led?.leds || []
}

export const getLEDConfigsSync = (): LEDConfig[] => {
  const config = getWidgetConfigSync()
  return config.led?.leds || []
}

export const updateLEDConfigs = async (leds: LEDConfig[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.led) {
    config.led = { leds: [], style: 'list' }
  }
  config.led.leds = leds
  await saveWidgetConfig(config)
}

export const getLEDStyle = async (): Promise<LEDStyle> => {
  const config = await getWidgetConfig()
  return config.led?.style || 'list'
}

export const getLEDStyleSync = (): LEDStyle => {
  const config = getWidgetConfigSync()
  return config.led?.style || 'list'
}

export const updateLEDStyle = async (style: LEDStyle): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.led) {
    config.led = { leds: [], style: 'list' }
  }
  config.led.style = style
  await saveWidgetConfig(config)
}

// Scenes Config functions
export const getScenesStyleSync = (): ScenesStyle => {
  const config = getWidgetConfigSync()
  return config.scenes?.style || 'grid'
}

export const getScenesStyle = async (): Promise<ScenesStyle> => {
  const config = await getWidgetConfig()
  return config.scenes?.style || 'grid'
}

export const updateScenesStyle = async (style: ScenesStyle): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.scenes) {
    config.scenes = { style, enabled: true, hiddenScenes: [] }
  } else {
    config.scenes.style = style
  }
  await saveWidgetConfig(config)
}

export const getHiddenScenes = async (): Promise<string[]> => {
  const config = await getWidgetConfig()
  return (config.scenes as any)?.hiddenScenes || []
}

export const getHiddenScenesSync = (): string[] => {
  const config = getWidgetConfigSync()
  return (config.scenes as any)?.hiddenScenes || []
}

export const updateHiddenScenes = async (hiddenScenes: string[]): Promise<void> => {
  const config = await getWidgetConfig()
  if (!config.scenes) {
    config.scenes = { style: 'grid', enabled: true }
  }
  ; (config.scenes as any).hiddenScenes = hiddenScenes
  await saveWidgetConfig(config)
}
