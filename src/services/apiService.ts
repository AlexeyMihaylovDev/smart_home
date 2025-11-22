// Сервис для работы с API сервера настроек
import axios from 'axios'

// Определяем URL сервера настроек
// Используем тот же хост, что и текущая страница, но порт 3001
const getApiBaseUrl = () => {
  const host = window.location.hostname
  const protocol = window.location.protocol
  // Если hostname localhost, используем localhost, иначе используем IP
  // Это позволяет работать как локально, так и с других компьютеров
  return `${protocol}//${host}:3001`
}

const API_BASE_URL = getApiBaseUrl()

// Получаем ID текущего пользователя
const getUserId = (): string | null => {
  return localStorage.getItem('user_id')
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
})

// Добавляем userId в заголовки всех запросов
apiClient.interceptors.request.use(
  (config) => {
    const userId = getUserId()
    // Для запроса логина userId еще не установлен - это нормально
    const isLoginRequest = config.url === '/api/auth/login'
    
    if (userId) {
      config.headers['x-user-id'] = userId
      console.log(`[API] Запрос к ${config.url} с userId: ${userId}`)
    } else if (!isLoginRequest) {
      // Показываем предупреждение только для запросов, которые требуют авторизации
      console.warn(`[API] Запрос к ${config.url} без userId!`)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Обработка ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    // Fallback на localStorage если сервер недоступен
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('Сервер недоступен, используется localStorage как fallback')
    }
    return Promise.reject(error)
  }
)

export interface WidgetConfig {
  ambientLighting: {
    lights: Array<{
      name: string
      entityId: string | null
      icon: 'clock' | 'lightbulb'
    }>
    style?: 'list' | 'cards' | 'compact' | 'minimal'
  }
  ac: {
    airConditioners: Array<{
      entityId: string | null
      name: string
    }>
  }
  waterHeater: {
    entityId: string | null
    name: string
  }
  sensors: {
    sensors: Array<{
      name: string
      entityId: string | null
      type: 'motion' | 'presence'
    }>
  }
  motors: {
    motors: Array<{
      entityId: string | null
      name: string
    }>
  }
  bose: {
    soundbars: Array<{
      entityId: string | null
      name: string
    }>
  }
  vacuum: {
    vacuums: Array<{
      entityId: string | null
      name: string
      mapEntityId?: string | null
      relatedEntities?: Array<{
        entityId: string
        type: 'map' | 'sensor' | 'camera' | 'image' | 'other'
        name?: string
      }>
    }>
  }
  tvPreview: {
    tvs: Array<{
      entityId: string | null
      name: string
    }>
  }
  clock: {
    name: string
    timezone?: string
    showSeconds?: boolean
    showDate?: boolean
    showDayOfWeek?: boolean
    format24h?: boolean
    style?: 'digital' | 'analog' | 'minimal'
  }
  led: {
    leds: Array<{
      entityId: string | null
      name: string
      type: 'rgb' | 'dimmer'
    }>
  }
  enabledWidgets: {
    [widgetId: string]: boolean
  }
  navigationIcons?: {
    icons: Array<{
      id: string
      label: string
      iconName: 'camera' | 'home' | 'network' | 'vacuum'
      enabled: boolean
      order: number
    }>
  }
}

export interface DashboardLayout {
  layouts: Array<{
    i: string
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }>
  cols: number
  rowHeight: number
  dashboardId?: string
}

export interface DashboardLayouts {
  [dashboardId: string]: DashboardLayout
}

export interface ConnectionConfig {
  url: string
  token: string
}

// Widget Config API
export const getWidgetConfig = async (): Promise<WidgetConfig> => {
  try {
    console.log('[API] Загрузка widget config с сервера...')
    const response = await apiClient.get('/api/config/widget')
    console.log('[API] Widget config загружен с сервера:', response.data)
    return response.data
  } catch (error: any) {
    console.error('[API] Ошибка загрузки widget config с сервера:', error)
    // Fallback на localStorage только если сервер недоступен
    try {
      const stored = localStorage.getItem('widget_config')
      if (stored) {
        console.log('[API] Используем widget config из localStorage (fallback)')
        return JSON.parse(stored)
      }
    } catch (localError) {
      console.error('[API] Ошибка чтения из localStorage:', localError)
    }
    throw error
  }
}

// Функция для очистки объекта от циклических ссылок
const cleanForSerialization = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  // Пропускаем DOM-элементы и React-компоненты
  if (obj instanceof HTMLElement || obj instanceof Element || obj.constructor?.name === 'FiberNode') {
    return undefined
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanForSerialization).filter(item => item !== undefined)
  }
  
  const cleaned: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Пропускаем React-специфичные свойства
      if (key.startsWith('__react') || key.startsWith('__FIBER') || key === 'stateNode') {
        continue
      }
      
      try {
        const value = cleanForSerialization(obj[key])
        if (value !== undefined) {
          cleaned[key] = value
        }
      } catch (e) {
        continue
      }
    }
  }
  return cleaned
}

export const saveWidgetConfig = async (config: WidgetConfig): Promise<void> => {
  try {
    // Очищаем конфигурацию перед сохранением
    const cleanedConfig = cleanForSerialization(config) as WidgetConfig
    console.log('[API] Сохранение widget config на сервер...', cleanedConfig)
    await apiClient.post('/api/config/widget', cleanedConfig)
    console.log('[API] Widget config успешно сохранен на сервер')
    // Также сохраняем в localStorage как backup
    try {
      localStorage.setItem('widget_config', JSON.stringify(cleanedConfig))
      console.log('[API] Widget config сохранен в localStorage как backup')
    } catch (localError) {
      console.warn('[API] Не удалось сохранить в localStorage (backup):', localError)
    }
  } catch (error: any) {
    console.error('[API] Ошибка сохранения widget config на сервер:', error)
    // Fallback на localStorage только если сервер недоступен
    try {
      const cleanedConfig = cleanForSerialization(config) as WidgetConfig
      localStorage.setItem('widget_config', JSON.stringify(cleanedConfig))
      console.warn('[API] Widget config сохранен в localStorage как fallback')
    } catch (localError) {
      console.error('[API] Ошибка сохранения в localStorage:', localError)
    }
    throw error
  }
}

// Layout API
export const getDashboardLayout = async (): Promise<DashboardLayout> => {
  try {
    const response = await apiClient.get('/api/config/layout')
    return response.data
  } catch (error) {
    console.error('Ошибка загрузки layout с сервера, используем localStorage:', error)
    // Fallback на localStorage
    const stored = localStorage.getItem('dashboard_layout')
    if (stored) {
      return JSON.parse(stored)
    }
    throw error
  }
}

export const saveDashboardLayout = async (layout: DashboardLayout): Promise<void> => {
  try {
    await apiClient.post('/api/config/layout', layout)
    // Также сохраняем в localStorage как backup
    localStorage.setItem('dashboard_layout', JSON.stringify(layout))
  } catch (error) {
    console.error('Ошибка сохранения layout на сервер, используем localStorage:', error)
    // Fallback на localStorage
    localStorage.setItem('dashboard_layout', JSON.stringify(layout))
    throw error
  }
}

// Dashboard Layouts API (для всех дашбордов пользователя)
export const getAllDashboardLayouts = async (): Promise<DashboardLayouts> => {
  try {
    console.log('[API] Загрузка dashboard layouts с сервера...')
    const response = await apiClient.get('/api/config/dashboard-layouts')
    console.log('[API] Dashboard layouts загружены с сервера:', response.data)
    return response.data || {}
  } catch (error: any) {
    console.error('[API] Ошибка загрузки dashboard layouts с сервера:', error)
    // Fallback на localStorage только если сервер недоступен
    try {
      const stored = localStorage.getItem('dashboard_layouts')
      if (stored) {
        console.log('[API] Используем dashboard layouts из localStorage (fallback)')
        return JSON.parse(stored)
      }
    } catch (localError) {
      console.error('[API] Ошибка чтения из localStorage:', localError)
    }
    return {}
  }
}

export const saveAllDashboardLayouts = async (layouts: DashboardLayouts): Promise<void> => {
  try {
    await apiClient.post('/api/config/dashboard-layouts', layouts)
    // Также сохраняем в localStorage как backup
    localStorage.setItem('dashboard_layouts', JSON.stringify(layouts))
  } catch (error) {
    console.error('Ошибка сохранения dashboard layouts на сервер, используем localStorage:', error)
    // Fallback на localStorage
    localStorage.setItem('dashboard_layouts', JSON.stringify(layouts))
    throw error
  }
}

// Connection API
export const getConnectionConfig = async (): Promise<{ url: string; token: string } | null> => {
  try {
    const response = await apiClient.get('/api/config/connection')
    // Сервер возвращает url и token напрямую
    if (response.data && (response.data.url || response.data.token)) {
      return {
        url: response.data.url || '',
        token: response.data.token || ''
      }
    }
    return null
  } catch (error) {
    console.error('Ошибка загрузки connection config с сервера:', error)
    // Не используем localStorage как fallback - настройки должны быть на сервере
    return null
  }
}

export const saveConnectionConfig = async (config: ConnectionConfig): Promise<void> => {
  try {
    await apiClient.post('/api/config/connection', config)
    console.log('Настройки Home Assistant сохранены на сервер для пользователя')
    // Не сохраняем в localStorage - все настройки на сервере
  } catch (error) {
    console.error('Ошибка сохранения connection config на сервер:', error)
    throw error
  }
}

// Проверка доступности сервера
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/health')
    return response.data.status === 'ok'
  } catch (error) {
    return false
  }
}

// API для аутентификации
export const login = async (username: string, password: string): Promise<{ user: { id: string; username: string } }> => {
  try {
    const response = await apiClient.post('/api/auth/login', { username, password })
    if (response.data.success && response.data.user) {
      return response.data
    }
    throw new Error('Неверное имя пользователя или пароль')
  } catch (error: any) {
    console.error('Ошибка входа:', error)
    // Обрабатываем сетевые ошибки
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Failed to fetch')) {
      throw new Error('Сервер недоступен. Убедитесь, что сервер запущен на порту 3001. Запустите: npm run dev')
    }
    // Обрабатываем ошибки ответа
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw error
  }
}

