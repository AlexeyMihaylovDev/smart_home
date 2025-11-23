// Сервис для управления layout виджетов
import { getAllEnabledWidgets, getAllEnabledWidgetsSync, isDemoMode } from './widgetConfig'
import {
  getDashboardLayout as getDashboardLayoutFromAPI,
  saveDashboardLayout as saveDashboardLayoutToAPI,
  DashboardLayout as APIDashboardLayout,
  getAllDashboardLayouts as getAllDashboardLayoutsFromAPI,
  saveAllDashboardLayouts as saveAllDashboardLayoutsToAPI,
  DashboardLayouts as APIDashboardLayouts
} from './apiService'

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
  dashboardId?: string // ID dashboard для которого этот layout
}

// Храним layouts для всех dashboard
export interface DashboardLayouts {
  [dashboardId: string]: DashboardLayout
}

const STORAGE_KEY = 'dashboard_layout'
const STORAGE_KEY_DASHBOARDS = 'dashboard_layouts' // Для хранения layouts всех dashboard
const DEFAULT_COLS = 12
const DEFAULT_ROW_HEIGHT = 60

// Кэш для синхронного доступа
let layoutCache: DashboardLayout | null = null
let dashboardLayoutsCache: DashboardLayouts | null = null

// Очистка кэша при смене пользователя
export const clearLayoutCache = () => {
  layoutCache = null
  dashboardLayoutsCache = null
}

// Слушаем событие смены пользователя
if (typeof window !== 'undefined') {
  window.addEventListener('user-changed', () => {
    clearLayoutCache()
  })
}

// Дефолтные layout для всех виджетов с оптимальными размерами для полного отображения данных
const DEFAULT_LAYOUTS: Record<string, Omit<WidgetLayout, 'i'>> = {
  'tv-time': { x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
  'media-player': { x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
  'spotify': { x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
  'media-room': { x: 6, y: 4, w: 6, h: 3, minW: 3, minH: 2 },
  'canvas': { x: 0, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
  'tv-preview': { x: 6, y: 7, w: 6, h: 3, minW: 4, minH: 2 },
  'clock': { x: 0, y: 12, w: 4, h: 4, minW: 3, minH: 3 },
  'led': { x: 4, y: 12, w: 4, h: 4, minW: 3, minH: 3 },
  'plex': { x: 8, y: 10, w: 4, h: 3, minW: 3, minH: 2 },
  'tv-duration': { x: 8, y: 13, w: 4, h: 3, minW: 3, minH: 2 },
  'weather-calendar': { x: 0, y: 16, w: 4, h: 6, minW: 3, minH: 4 },
  'ambient-lighting': { x: 4, y: 16, w: 4, h: 5, minW: 3, minH: 4 },
  'living-room': { x: 8, y: 16, w: 4, h: 4, minW: 3, minH: 3 },
  'ac': { x: 0, y: 22, w: 6, h: 6, minW: 4, minH: 5 },
  'water-heater': { x: 6, y: 22, w: 6, h: 6, minW: 4, minH: 5 },
  'sensors': { x: 0, y: 28, w: 6, h: 5, minW: 4, minH: 4 },
  'motors': { x: 6, y: 28, w: 6, h: 5, minW: 4, minH: 4 },
  'bose': { x: 0, y: 33, w: 6, h: 6, minW: 4, minH: 5 },
  'vacuum': { x: 6, y: 33, w: 6, h: 6, minW: 4, minH: 5 },
  'cameras': { x: 0, y: 39, w: 12, h: 8, minW: 6, minH: 6 },
}

// Функция для автоматического равномерного распределения виджетов (Dense Packing)
const autoDistributeWidgets = (widgetIds: string[], cols: number): WidgetLayout[] => {
  if (widgetIds.length === 0) return []

  const layouts: WidgetLayout[] = []
  const occupied: boolean[][] = []
  const remainingWidgets = [...widgetIds]

  // Функция для проверки, занята ли ячейка
  const isOccupied = (x: number, y: number): boolean => {
    return occupied[y] && occupied[y][x]
  }

  // Функция для маркировки ячеек как занятых
  const setOccupied = (x: number, y: number, w: number, h: number): void => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const markY = y + dy
        const markX = x + dx
        if (!occupied[markY]) {
          occupied[markY] = []
        }
        occupied[markY][markX] = true
      }
    }
  }

  // Функция для проверки, помещается ли виджет
  const canPlace = (x: number, y: number, w: number, h: number): boolean => {
    if (x + w > cols) return false

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (isOccupied(x + dx, y + dy)) {
          return false
        }
      }
    }
    return true
  }

  // Определяем оптимальные размеры для каждого виджета
  const getOptimalSize = (widgetId: string, cols: number): { w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number } => {
    const defaultLayout = DEFAULT_LAYOUTS[widgetId] || { w: 4, h: 3, minW: 2, minH: 2 }

    // Адаптируем размеры в зависимости от количества колонок
    let optimalW = defaultLayout.w
    let optimalH = defaultLayout.h

    if (cols <= 4) {
      // Мобильные устройства - виджеты на всю ширину
      optimalW = cols
      optimalH = Math.max(2, Math.round(defaultLayout.h * 0.7))
    } else if (cols <= 6) {
      // Планшеты - виджеты по 3 колонки
      optimalW = Math.min(6, Math.max(3, defaultLayout.w))
      optimalH = Math.max(2, Math.round(defaultLayout.h * 0.9))
    } else if (cols >= 16) {
      // Большие экраны - увеличиваем размеры
      optimalW = Math.min(cols / 2, defaultLayout.w * 1.2)
      optimalH = Math.max(3, Math.round(defaultLayout.h * 1.1))
    }

    // Обеспечиваем минимальные размеры
    const minW = defaultLayout.minW || 2
    const minH = defaultLayout.minH || 2

    return {
      w: Math.max(minW, Math.min(optimalW, cols)),
      h: Math.max(minH, optimalH),
      minW: defaultLayout.minW,
      minH: defaultLayout.minH,
      maxW: defaultLayout.maxW,
      maxH: defaultLayout.maxH
    }
  }

  // Проходим по сетке и пытаемся заполнить пустые места
  // Ограничиваем высоту поиска разумным пределом
  for (let y = 0; remainingWidgets.length > 0 && y < 1000; y++) {
    for (let x = 0; x < cols; x++) {
      if (isOccupied(x, y)) continue

      // Нашли пустое место. Ищем первый виджет, который сюда поместится.
      let foundIndex = -1

      for (let i = 0; i < remainingWidgets.length; i++) {
        const widgetId = remainingWidgets[i]
        const size = getOptimalSize(widgetId, cols)

        if (canPlace(x, y, size.w, size.h)) {
          foundIndex = i
          break
        }
      }

      if (foundIndex !== -1) {
        // Размещаем виджет
        const widgetId = remainingWidgets[foundIndex]
        const size = getOptimalSize(widgetId, cols)

        layouts.push({
          i: widgetId,
          x: x,
          y: y,
          w: size.w,
          h: size.h,
          minW: size.minW,
          minH: size.minH,
          maxW: size.maxW,
          maxH: size.maxH
        })

        setOccupied(x, y, size.w, size.h)
        remainingWidgets.splice(foundIndex, 1)
      }
    }
  }

  // Если остались виджеты (не влезли в лимит y), просто добавляем их в конец
  if (remainingWidgets.length > 0) {
    let maxY = 0
    layouts.forEach(l => maxY = Math.max(maxY, l.y + l.h))

    remainingWidgets.forEach((widgetId, index) => {
      const size = getOptimalSize(widgetId, cols)
      layouts.push({
        i: widgetId,
        x: 0,
        y: maxY + (index * size.h),
        w: size.w,
        h: size.h,
        minW: size.minW,
        minH: size.minH,
        maxW: size.maxW,
        maxH: size.maxH
      })
    })
  }

  return layouts
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

export const getDashboardLayout = async (): Promise<DashboardLayout> => {
  if (isDemoMode()) {

    const enabledWidgets = await getAllEnabledWidgets()
    const layouts = autoDistributeWidgets(enabledWidgets, DEFAULT_COLS)
    return {
      layouts,
      cols: DEFAULT_COLS,
      rowHeight: DEFAULT_ROW_HEIGHT
    }
  }

  try {

    const stored = await getDashboardLayoutFromAPI()

    const enabledWidgets = await getAllEnabledWidgets()

    // Сохраняем savedCols для использования ниже
    const savedCols = stored?.cols || DEFAULT_COLS

    if (stored && stored.layouts && stored.layouts.length > 0) {
      const savedLayouts = stored.layouts || []

      // Фильтруем только включенные виджеты
      const enabledLayouts = savedLayouts
        .filter((l: WidgetLayout) => enabledWidgets.includes(l.i))
        .map((l: WidgetLayout) => {
          // Обновляем minW и minH из DEFAULT_LAYOUTS, если они изменились
          const defaultLayout = DEFAULT_LAYOUTS[l.i]
          if (defaultLayout) {
            return {
              ...l,
              minW: defaultLayout.minW,
              minH: defaultLayout.minH,
              maxW: defaultLayout.maxW,
              maxH: defaultLayout.maxH,
            }
          }
          return l
        })

      // Получаем список ID виджетов из сохраненного layout
      const savedWidgetIds = new Set(enabledLayouts.map((l: WidgetLayout) => l.i))

      // Добавляем новые включенные виджеты, которых нет в сохраненном layout
      const missingWidgets = enabledWidgets
        .filter(id => !savedWidgetIds.has(id))

      // Используем автоматическое распределение для новых виджетов
      const newLayouts = missingWidgets.length > 0
        ? autoDistributeWidgets(missingWidgets, savedCols || DEFAULT_COLS)
        : []

      // Смещаем новые виджеты вниз, чтобы они не перекрывали существующие
      const maxY = enabledLayouts.length > 0
        ? Math.max(...enabledLayouts.map(l => l.y + l.h))
        : -1

      const adjustedNewLayouts = newLayouts.map(layout => ({
        ...layout,
        y: layout.y + maxY + 1
      }))

      // Объединяем сохраненные виджеты с новыми
      const mergedLayouts = [...enabledLayouts, ...adjustedNewLayouts]

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
        const savedLayouts = (parsed.layouts || []) as WidgetLayout[]
        const enabledLayouts = savedLayouts
          .filter((l) => enabledWidgets.includes(l.i))
          .map((l) => {
            // Обновляем minW и minH из DEFAULT_LAYOUTS, если они изменились
            const defaultLayout = DEFAULT_LAYOUTS[l.i]
            if (defaultLayout) {
              return {
                ...l,
                minW: defaultLayout.minW,
                minH: defaultLayout.minH,
                maxW: defaultLayout.maxW,
                maxH: defaultLayout.maxH,
              }
            }
            return l
          })
        const savedWidgetIds = new Set(enabledLayouts.map((l: WidgetLayout) => l.i))
        const missingWidgets = enabledWidgets
          .filter(id => !savedWidgetIds.has(id))

        // Используем автоматическое распределение для новых виджетов
        const newLayouts = missingWidgets.length > 0
          ? autoDistributeWidgets(missingWidgets, parsed.cols || DEFAULT_COLS)
          : []

        // Смещаем новые виджеты вниз, чтобы они не перекрывали существующие
        const maxY = enabledLayouts.length > 0
          ? Math.max(...enabledLayouts.map(l => l.y + l.h))
          : -1

        const adjustedNewLayouts = newLayouts.map(layout => ({
          ...layout,
          y: layout.y + maxY + 1
        }))

        const mergedLayouts = [...enabledLayouts, ...adjustedNewLayouts]
        const compactedLayouts = compactLayoutVertical(mergedLayouts, DEFAULT_COLS)
        const result = {
          layouts: compactedLayouts,
          cols: parsed.cols || DEFAULT_COLS,
          rowHeight: parsed.rowHeight || DEFAULT_ROW_HEIGHT
        }
        layoutCache = result
        console.log('[WidgetLayout] Используем layout из localStorage (fallback)')
        return result
      }
    } catch (localError) {
      console.error('[WidgetLayout] Ошибка загрузки из localStorage:', localError)
    }
  }

  // Если нет сохраненного layout, создаем новый с автоматическим распределением
  console.log('[WidgetLayout] Создаем новый layout для включенных виджетов')
  const enabledWidgets = await getAllEnabledWidgets()
  console.log('[WidgetLayout] Включенные виджеты:', enabledWidgets)

  if (enabledWidgets.length === 0) {
    console.warn('[WidgetLayout] Нет включенных виджетов! Layout будет пустым.')
    const emptyResult = {
      layouts: [],
      cols: DEFAULT_COLS,
      rowHeight: DEFAULT_ROW_HEIGHT
    }
    layoutCache = emptyResult
    return emptyResult
  }

  // Используем автоматическое распределение для равномерного размещения
  const layouts = autoDistributeWidgets(enabledWidgets, DEFAULT_COLS)
  console.log('[WidgetLayout] Создан новый layout с виджетами:', layouts.map(l => l.i))

  const result = {
    layouts,
    cols: DEFAULT_COLS,
    rowHeight: DEFAULT_ROW_HEIGHT
  }
  layoutCache = result

  // Автоматически сохраняем новый layout на сервер в базу данных
  try {
    console.log('[WidgetLayout] Сохранение нового layout на сервер в базу данных...')
    await saveDashboardLayoutToAPI(result as APIDashboardLayout)
    console.log('[WidgetLayout] Новый layout успешно сохранен на сервер в базу данных')
  } catch (error) {
    console.error('[WidgetLayout] Ошибка сохранения нового layout на сервер:', error)
    // Продолжаем работу даже если сохранение не удалось
  }

  return result
}

// Синхронная версия для обратной совместимости
export const getDashboardLayoutSync = (): DashboardLayout => {
  if (isDemoMode()) {
    const enabledWidgets = getAllEnabledWidgetsSync()
    const layouts = autoDistributeWidgets(enabledWidgets, DEFAULT_COLS)
    return {
      layouts,
      cols: DEFAULT_COLS,
      rowHeight: DEFAULT_ROW_HEIGHT
    }
  }

  if (layoutCache) {
    return layoutCache
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const enabledWidgets = getAllEnabledWidgetsSync()

    if (stored) {
      const parsed = JSON.parse(stored)
      const savedLayouts = (parsed.layouts || []) as WidgetLayout[]
      const enabledLayouts = savedLayouts.filter((l) => enabledWidgets.includes(l.i))
      const savedWidgetIds = new Set(enabledLayouts.map((l) => l.i))
      const missingWidgets = enabledWidgets
        .filter(id => !savedWidgetIds.has(id))

      // Используем автоматическое распределение для новых виджетов
      const newLayouts = missingWidgets.length > 0
        ? autoDistributeWidgets(missingWidgets, parsed.cols || DEFAULT_COLS)
        : []

      // Смещаем новые виджеты вниз, чтобы они не перекрывали существующие
      const maxY = enabledLayouts.length > 0
        ? Math.max(...enabledLayouts.map(l => l.y + l.h))
        : -1

      const adjustedNewLayouts = newLayouts.map(layout => ({
        ...layout,
        y: layout.y + maxY + 1
      }))

      const mergedLayouts = [...enabledLayouts, ...adjustedNewLayouts]
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

  // Используем автоматическое распределение для равномерного размещения
  const layouts = autoDistributeWidgets(enabledWidgets, DEFAULT_COLS)

  const result = {
    layouts,
    cols: DEFAULT_COLS,
    rowHeight: DEFAULT_ROW_HEIGHT
  }
  layoutCache = result
  return result
}

export const saveDashboardLayout = async (layout: DashboardLayout): Promise<void> => {
  try {
    // Всегда сохраняем на сервер в первую очередь
    await saveDashboardLayoutToAPI(layout as APIDashboardLayout)
    layoutCache = layout
    // Также сохраняем в localStorage как backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch (localError) {
      console.warn('Не удалось сохранить в localStorage (backup):', localError)
    }
  } catch (error) {
    console.error('Ошибка сохранения layout на сервер:', error)
    // Fallback на localStorage только если сервер недоступен
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
      layoutCache = layout
      console.warn('Layout сохранен в localStorage как fallback')
    } catch (localError) {
      console.error('Ошибка сохранения в localStorage:', localError)
      throw error // Пробрасываем ошибку дальше
    }
  }
}

export const updateWidgetLayout = async (layouts: WidgetLayout[], cols?: number, rowHeight?: number, dashboardId?: string): Promise<void> => {
  if (dashboardId) {
    // Сохраняем layout для конкретного dashboard
    const current = await getDashboardLayoutByDashboardId(dashboardId)
    const targetCols = cols || current.cols || DEFAULT_COLS
    const targetRowHeight = rowHeight || current.rowHeight || DEFAULT_ROW_HEIGHT
    const compactedLayouts = compactLayoutVertical(layouts, targetCols)
    await saveDashboardLayoutByDashboardId(dashboardId, {
      layouts: compactedLayouts,
      cols: targetCols,
      rowHeight: targetRowHeight,
      dashboardId
    })
  } else {
    // Старый способ для обратной совместимости
    const current = await getDashboardLayout()
    const targetCols = cols || current.cols || DEFAULT_COLS
    const targetRowHeight = rowHeight || current.rowHeight || DEFAULT_ROW_HEIGHT
    const compactedLayouts = compactLayoutVertical(layouts, targetCols)
    await saveDashboardLayout({
      layouts: compactedLayouts,
      cols: targetCols,
      rowHeight: targetRowHeight
    })
  }
}

// Функции для работы с layouts конкретного dashboard
export const getDashboardLayoutByDashboardId = async (dashboardId: string): Promise<DashboardLayout> => {
  try {
    // Загружаем все dashboard layouts
    const allLayouts = await getAllDashboardLayouts()
    if (allLayouts[dashboardId] && allLayouts[dashboardId].layouts && allLayouts[dashboardId].layouts.length > 0) {
      return allLayouts[dashboardId]
    }
  } catch (error) {
    console.error('Ошибка загрузки layout для dashboard:', error)
  }

  // Если layout не найден, создаем новый с автоматическим распределением
  console.log(`[WidgetLayout] Создаем новый layout для dashboard ${dashboardId}`)
  const enabledWidgets = await getAllEnabledWidgets()
  const layouts = autoDistributeWidgets(enabledWidgets, DEFAULT_COLS)

  const newLayout = {
    layouts,
    cols: DEFAULT_COLS,
    rowHeight: DEFAULT_ROW_HEIGHT,
    dashboardId
  }

  // Автоматически сохраняем новый layout на сервер в базу данных
  try {
    console.log(`[WidgetLayout] Сохранение нового layout для dashboard ${dashboardId} на сервер...`)
    await saveDashboardLayoutByDashboardId(dashboardId, newLayout)
    console.log(`[WidgetLayout] Новый layout для dashboard ${dashboardId} успешно сохранен на сервер`)
  } catch (error) {
    console.error(`[WidgetLayout] Ошибка сохранения нового layout для dashboard ${dashboardId}:`, error)
  }

  return newLayout
}

export const saveDashboardLayoutByDashboardId = async (dashboardId: string, layout: DashboardLayout): Promise<void> => {
  try {
    const allLayouts = await getAllDashboardLayouts()
    allLayouts[dashboardId] = { ...layout, dashboardId }
    await saveAllDashboardLayouts(allLayouts)
    if (dashboardLayoutsCache) {
      dashboardLayoutsCache[dashboardId] = layout
    }
  } catch (error) {
    console.error('Ошибка сохранения layout для dashboard:', error)
  }
}

export const getAllDashboardLayouts = async (): Promise<DashboardLayouts> => {
  if (dashboardLayoutsCache) {
    console.log('[WidgetLayout] Используем кэш dashboard layouts')
    return dashboardLayoutsCache
  }

  try {
    console.log('[WidgetLayout] Загрузка dashboard layouts с сервера...')
    // Используем API для загрузки с сервера
    const layouts = await getAllDashboardLayoutsFromAPI()
    console.log('[WidgetLayout] Dashboard layouts загружены с сервера:', layouts)
    dashboardLayoutsCache = layouts
    // Сохраняем в localStorage как backup
    try {
      localStorage.setItem(STORAGE_KEY_DASHBOARDS, JSON.stringify(layouts))
      console.log('[WidgetLayout] Dashboard layouts сохранены в localStorage как backup')
    } catch (e) {
      console.warn('[WidgetLayout] Не удалось сохранить dashboard layouts в localStorage:', e)
    }
    return layouts
  } catch (error) {
    console.error('[WidgetLayout] Ошибка загрузки dashboard layouts с сервера:', error)
    // Fallback на localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DASHBOARDS)
      if (stored) {
        console.log('[WidgetLayout] Используем dashboard layouts из localStorage (fallback)')
        const layouts = JSON.parse(stored)
        dashboardLayoutsCache = layouts
        return layouts
      }
    } catch (e) {
      console.error('[WidgetLayout] Ошибка чтения dashboard layouts из localStorage:', e)
    }
    return {}
  }
}

export const saveAllDashboardLayouts = async (layouts: DashboardLayouts): Promise<void> => {
  try {
    await saveAllDashboardLayoutsToAPI(layouts as APIDashboardLayouts)
    dashboardLayoutsCache = layouts
    // Также сохраняем в localStorage как backup
    try {
      localStorage.setItem(STORAGE_KEY_DASHBOARDS, JSON.stringify(layouts))
    } catch (e) {
      console.warn('[WidgetLayout] Не удалось сохранить dashboard layouts в localStorage:', e)
    }
  } catch (error) {
    console.error('Ошибка сохранения dashboard layouts на сервер:', error)
    // Fallback на localStorage
    try {
      localStorage.setItem(STORAGE_KEY_DASHBOARDS, JSON.stringify(layouts))
      dashboardLayoutsCache = layouts
    } catch (e) {
      console.error('Ошибка сохранения dashboard layouts в localStorage:', e)
      throw error
    }
  }
}
