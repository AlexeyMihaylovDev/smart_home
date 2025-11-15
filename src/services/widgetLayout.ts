// Сервис для управления layout виджетов
import { getAllEnabledWidgets } from './widgetConfig'

export interface WidgetLayout {
  i: string // id виджета
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface DashboardLayout {
  layouts: WidgetLayout[]
  cols: number
  rowHeight: number
}

const STORAGE_KEY = 'dashboard_layout'
const DEFAULT_COLS = 12
const DEFAULT_ROW_HEIGHT = 60

// Дефолтные layout для всех виджетов (используются только для новых виджетов)
const DEFAULT_LAYOUTS: Record<string, Omit<WidgetLayout, 'i'>> = {
  'tv-time': { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  'media-player': { x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  'spotify': { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
  'media-room': { x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
  'canvas': { x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
  'tv-preview': { x: 8, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
  'plex': { x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 2 },
  'tv-duration': { x: 4, y: 6, w: 4, h: 2, minW: 2, minH: 2 },
  'weather-calendar': { x: 8, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
  'ambient-lighting': { x: 0, y: 6, w: 4, h: 4, minW: 2, minH: 3 },
  'living-room': { x: 0, y: 10, w: 4, h: 3, minW: 2, minH: 2 },
  'ac': { x: 4, y: 10, w: 4, h: 5, minW: 3, minH: 4 },
}

export const getDashboardLayout = (): DashboardLayout => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const enabledWidgets = getAllEnabledWidgets()
    
    if (stored) {
      const parsed = JSON.parse(stored)
      const savedLayouts = parsed.layouts || []
      
      // Фильтруем только включенные виджеты
      const enabledLayouts = savedLayouts.filter((l: WidgetLayout) => enabledWidgets.includes(l.i))
      
      // Получаем список ID виджетов из сохраненного layout
      const savedWidgetIds = new Set(enabledLayouts.map((l: WidgetLayout) => l.i))
      
      // Добавляем новые включенные виджеты, которых нет в сохраненном layout
      const missingWidgets = enabledWidgets
        .filter(id => !savedWidgetIds.has(id))
        .map(id => ({
          i: id,
          ...(DEFAULT_LAYOUTS[id] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 })
        }))
      
      // Объединяем сохраненные виджеты с новыми
      const mergedLayouts = [...enabledLayouts, ...missingWidgets]
      
      return {
        layouts: mergedLayouts,
        cols: parsed.cols || DEFAULT_COLS,
        rowHeight: parsed.rowHeight || DEFAULT_ROW_HEIGHT
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки layout:', error)
  }
  
  // Если нет сохраненного layout, возвращаем только включенные виджеты
  const enabledWidgets = getAllEnabledWidgets()
  const layouts = enabledWidgets.map(id => ({
    i: id,
    ...(DEFAULT_LAYOUTS[id] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 })
  }))
  
  return {
    layouts,
    cols: DEFAULT_COLS,
    rowHeight: DEFAULT_ROW_HEIGHT
  }
}

export const saveDashboardLayout = (layout: DashboardLayout): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch (error) {
    console.error('Ошибка сохранения layout:', error)
  }
}

export const updateWidgetLayout = (layouts: WidgetLayout[]): void => {
  const current = getDashboardLayout()
  saveDashboardLayout({
    ...current,
    layouts
  })
}

