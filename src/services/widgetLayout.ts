// Сервис для управления layout виджетов
import { getAllEnabledWidgets, getAllEnabledWidgetsSync } from './widgetConfig'
import { getDashboardLayout as getDashboardLayoutFromAPI, saveDashboardLayout as saveDashboardLayoutToAPI, DashboardLayout as APIDashboardLayout } from './apiService'

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

// Кэш для синхронного доступа
let layoutCache: DashboardLayout | null = null

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
  'water-heater': { x: 8, y: 10, w: 4, h: 5, minW: 3, minH: 4 },
  'sensors': { x: 0, y: 13, w: 4, h: 4, minW: 2, minH: 3 },
  'motors': { x: 4, y: 13, w: 4, h: 4, minW: 3, minH: 3 },
}

export const getDashboardLayout = async (): Promise<DashboardLayout> => {
  try {
    const stored = await getDashboardLayoutFromAPI()
    const enabledWidgets = await getAllEnabledWidgets()
    
    if (stored && stored.layouts && stored.layouts.length > 0) {
      const savedLayouts = stored.layouts || []
      
      // Фильтруем только включенные виджеты
      const enabledLayouts = savedLayouts.filter((l: WidgetLayout) => enabledWidgets.includes(l.i))
      
      // Получаем список ID виджетов из сохраненного layout
      const savedWidgetIds = new Set(enabledLayouts.map((l: WidgetLayout) => l.i))
      
      // Добавляем новые включенные виджеты, которых нет в сохраненном layout
      const missingWidgets = enabledWidgets
        .filter(id => !savedWidgetIds.has(id))
        .map((id, index) => {
          // Автоматически размещаем новые виджеты компактно
          const maxY = enabledLayouts.length > 0 
            ? Math.max(...enabledLayouts.map(l => l.y + l.h))
            : -1
          const defaultLayout = DEFAULT_LAYOUTS[id] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }
          return {
            i: id,
            ...defaultLayout,
            y: maxY + 1, // Размещаем после последнего виджета
            x: (index % 3) * 4 // Распределяем по колонкам
          }
        })
      
      // Объединяем сохраненные виджеты с новыми
      const mergedLayouts = [...enabledLayouts, ...missingWidgets]
      
      // Компактируем layout - убираем пустые места
      const compactedLayouts = compactLayoutVertical(mergedLayouts, DEFAULT_COLS)
      
      const result = {
        layouts: compactedLayouts,
        cols: stored.cols || DEFAULT_COLS,
        rowHeight: stored.rowHeight || DEFAULT_ROW_HEIGHT
      }
      layoutCache = result
      return result
    }
  } catch (error) {
    console.error('Ошибка загрузки layout с сервера:', error)
    // Fallback на localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const enabledWidgets = getAllEnabledWidgetsSync()
        const savedLayouts = parsed.layouts || []
        const enabledLayouts = savedLayouts.filter((l: WidgetLayout) => enabledWidgets.includes(l.i))
        const savedWidgetIds = new Set(enabledLayouts.map((l: WidgetLayout) => l.i))
        const missingWidgets = enabledWidgets
          .filter(id => !savedWidgetIds.has(id))
          .map((id, index) => {
            const maxY = enabledLayouts.length > 0 
              ? Math.max(...enabledLayouts.map(l => l.y + l.h))
              : -1
            const defaultLayout = DEFAULT_LAYOUTS[id] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }
            return {
              i: id,
              ...defaultLayout,
              y: maxY + 1,
              x: (index % 3) * 4
            }
          })
        const mergedLayouts = [...enabledLayouts, ...missingWidgets]
        const compactedLayouts = compactLayoutVertical(mergedLayouts, DEFAULT_COLS)
        const result = {
          layouts: compactedLayouts,
          cols: parsed.cols || DEFAULT_COLS,
          rowHeight: parsed.rowHeight || DEFAULT_ROW_HEIGHT
        }
        layoutCache = result
        return result
      }
    } catch (localError) {
      console.error('Ошибка загрузки из localStorage:', localError)
    }
  }
  
  // Если нет сохраненного layout, возвращаем только включенные виджеты
  const enabledWidgets = await getAllEnabledWidgets()
  const layouts = enabledWidgets.map((id, index) => {
    const defaultLayout = DEFAULT_LAYOUTS[id] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }
    // Размещаем виджеты компактно в сетке
    const col = index % 3
    const row = Math.floor(index / 3)
    return {
      i: id,
      ...defaultLayout,
      x: col * 4,
      y: row * 3
    }
  })
  
  // Компактируем layout
  const compactedLayouts = compactLayoutVertical(layouts, DEFAULT_COLS)
  
  const result = {
    layouts: compactedLayouts,
    cols: DEFAULT_COLS,
    rowHeight: DEFAULT_ROW_HEIGHT
  }
  layoutCache = result
  return result
}

// Синхронная версия для обратной совместимости
export const getDashboardLayoutSync = (): DashboardLayout => {
  if (layoutCache) {
    return layoutCache
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const enabledWidgets = getAllEnabledWidgetsSync()
    
    if (stored) {
      const parsed = JSON.parse(stored)
      const savedLayouts = parsed.layouts || []
      const enabledLayouts = savedLayouts.filter((l: WidgetLayout) => enabledWidgets.includes(l.i))
      const savedWidgetIds = new Set(enabledLayouts.map((l: WidgetLayout) => l.i))
      const missingWidgets = enabledWidgets
        .filter(id => !savedWidgetIds.has(id))
        .map((id, index) => {
          const maxY = enabledLayouts.length > 0 
            ? Math.max(...enabledLayouts.map(l => l.y + l.h))
            : -1
          const defaultLayout = DEFAULT_LAYOUTS[id] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }
          return {
            i: id,
            ...defaultLayout,
            y: maxY + 1,
            x: (index % 3) * 4
          }
        })
      const mergedLayouts = [...enabledLayouts, ...missingWidgets]
      const compactedLayouts = compactLayoutVertical(mergedLayouts, DEFAULT_COLS)
      const result = {
        layouts: compactedLayouts,
        cols: parsed.cols || DEFAULT_COLS,
        rowHeight: parsed.rowHeight || DEFAULT_ROW_HEIGHT
      }
      layoutCache = result
      return result
    }
  } catch (error) {
    console.error('Ошибка загрузки layout:', error)
  }
  
  const enabledWidgets = getAllEnabledWidgetsSync()
  const layouts = enabledWidgets.map((id, index) => {
    const defaultLayout = DEFAULT_LAYOUTS[id] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }
    const col = index % 3
    const row = Math.floor(index / 3)
    return {
      i: id,
      ...defaultLayout,
      x: col * 4,
      y: row * 3
    }
  })
  
  const compactedLayouts = compactLayoutVertical(layouts, DEFAULT_COLS)
  const result = {
    layouts: compactedLayouts,
    cols: DEFAULT_COLS,
    rowHeight: DEFAULT_ROW_HEIGHT
  }
  layoutCache = result
  return result
}

// Функция для вертикального компактирования layout - убирает пустые места
const compactLayoutVertical = (layouts: WidgetLayout[], cols: number): WidgetLayout[] => {
  if (layouts.length === 0) return []
  
  // Сортируем виджеты по текущей позиции (сверху вниз, слева направо)
  const sorted = [...layouts].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })
  
  // Массив для отслеживания занятых ячеек
  const occupied: boolean[][] = []
  
  const compacted: WidgetLayout[] = []
  
  for (const item of sorted) {
    let placed = false
    let newY = 0
    let newX = 0
    
    // Ищем первое свободное место, начиная сверху
    while (!placed) {
      // Проверяем, помещается ли виджет на текущей позиции
      let fits = true
      
      // Проверяем все ячейки, которые займет виджет
      for (let dx = 0; dx < item.w && fits; dx++) {
        for (let dy = 0; dy < item.h && fits; dy++) {
          const checkX = newX + dx
          const checkY = newY + dy
          
          // Проверяем границы
          if (checkX >= cols || checkX < 0) {
            fits = false
            break
          }
          
          // Проверяем, занята ли ячейка
          if (!occupied[checkY]) {
            occupied[checkY] = []
          }
          if (occupied[checkY][checkX]) {
            fits = false
          }
        }
      }
      
      if (fits) {
        // Помечаем ячейки как занятые
        for (let dx = 0; dx < item.w; dx++) {
          for (let dy = 0; dy < item.h; dy++) {
            const markX = newX + dx
            const markY = newY + dy
            
            if (!occupied[markY]) {
              occupied[markY] = []
            }
            occupied[markY][markX] = true
          }
        }
        
        compacted.push({
          ...item,
          x: newX,
          y: newY
        })
        placed = true
      } else {
        // Пробуем следующую позицию
        newX += 1
        if (newX + item.w > cols) {
          newX = 0
          newY += 1
        }
      }
    }
  }
  
  return compacted
}


export const saveDashboardLayout = async (layout: DashboardLayout): Promise<void> => {
  try {
    await saveDashboardLayoutToAPI(layout as APIDashboardLayout)
    layoutCache = layout
    // Также сохраняем в localStorage как backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch (error) {
    console.error('Ошибка сохранения layout на сервер:', error)
    // Fallback на localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
      layoutCache = layout
    } catch (localError) {
      console.error('Ошибка сохранения в localStorage:', localError)
    }
  }
}

export const updateWidgetLayout = async (layouts: WidgetLayout[]): Promise<void> => {
  const current = await getDashboardLayout()
  // Компактируем layout перед сохранением, чтобы убрать пустые места
  const compactedLayouts = compactLayoutVertical(layouts, current.cols)
  await saveDashboardLayout({
    ...current,
    layouts: compactedLayouts
  })
}

