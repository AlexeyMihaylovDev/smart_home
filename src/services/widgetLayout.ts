// Сервис для управления layout виджетов

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

// Дефолтные layout для всех виджетов
const DEFAULT_LAYOUTS: WidgetLayout[] = [
  { i: 'tv-time', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: 'media-player', x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'spotify', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
  { i: 'media-room', x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
  { i: 'canvas', x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'tv-preview', x: 8, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
  { i: 'plex', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 2 },
  { i: 'tv-duration', x: 4, y: 6, w: 4, h: 2, minW: 2, minH: 2 },
  { i: 'weather-calendar', x: 8, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
  { i: 'ambient-lighting', x: 0, y: 6, w: 4, h: 4, minW: 2, minH: 3 },
  { i: 'living-room', x: 0, y: 10, w: 4, h: 3, minW: 2, minH: 2 },
  { i: 'ac', x: 4, y: 10, w: 4, h: 5, minW: 3, minH: 4 },
]

export const getDashboardLayout = (): DashboardLayout => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        layouts: parsed.layouts || DEFAULT_LAYOUTS,
        cols: parsed.cols || DEFAULT_COLS,
        rowHeight: parsed.rowHeight || DEFAULT_ROW_HEIGHT
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки layout:', error)
  }
  return {
    layouts: DEFAULT_LAYOUTS,
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

