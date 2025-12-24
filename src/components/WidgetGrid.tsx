import { useState, useEffect, useCallback, useRef } from 'react'
import GridLayout from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import TVTimeWidget from './widgets/TVTimeWidget'
import MediaPlayerWidget from './widgets/MediaPlayerWidget'
import SpotifyWidget from './widgets/SpotifyWidget'
import MediaRoomWidget from './widgets/MediaRoomWidget'
import CanvasWidget from './widgets/CanvasWidget'
import TVPreviewWidget from './widgets/TVPreviewWidget'
import ClockWidget from './widgets/ClockWidget'
import LEDWidget from './widgets/LEDWidget'
import PlexWidget from './widgets/PlexWidget'
import TVDurationWidget from './widgets/TVDurationWidget'
import AmbientLightingWidget from './widgets/AmbientLightingWidget'
import LivingRoomWidget from './widgets/LivingRoomWidget'
import WeatherCalendarWidget from './widgets/WeatherCalendarWidget'
import ACWidget from './widgets/ACWidget'
import WaterHeaterWidget from './widgets/WaterHeaterWidget'
import SensorsWidget from './widgets/SensorsWidget'
import MotorWidget from './widgets/MotorWidget'
import BoseWidget from './widgets/BoseWidget'
import VacuumWidget from './widgets/VacuumWidget'
import CamerasWidget from './widgets/CamerasWidget'
import { getDashboardLayout, getDashboardLayoutSync, updateWidgetLayout, WidgetLayout, getDashboardLayoutByDashboardId } from '../services/widgetLayout'
import { isWidgetEnabledSync, getNavigationIconsSync } from '../services/widgetConfig'
import { GripVertical, Pencil, X, LayoutGrid } from 'lucide-react'

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Get screen dimensions - memoized values
const getScreenDimensions = () => {
  if (typeof window === 'undefined') return { width: 1200, height: 800 }
  return { width: window.innerWidth, height: window.innerHeight }
}

// Calculate columns based on screen width
const getColsForWidth = (width: number): number => {
  if (width < 640) return 4    // Mobile
  if (width < 1024) return 6   // Tablet
  if (width < 1920) return 12  // Desktop
  return 16                     // Large screens/TV
}

// Calculate row height based on screen width
const getRowHeightForWidth = (width: number): number => {
  if (width < 640) return 50   // Mobile - compact
  if (width < 1024) return 55  // Tablet
  if (width < 1920) return 60  // Desktop
  return 70                     // Large screens/TV
}

// Unified layout scaling function - used everywhere instead of duplicate code
const scaleLayoutItem = (
  item: Layout,
  fromCols: number,
  toCols: number,
  screenWidth: number
): Layout => {
  const scale = toCols / fromCols
  const isMobile = screenWidth < 640
  const isTablet = screenWidth >= 640 && screenWidth < 1024
  const isLargeScreen = screenWidth >= 1920

  let newW = Math.max(1, Math.round(item.w * scale))
  let newH = item.h

  // Adjust for screen size
  if (isMobile) {
    newW = toCols  // Full width on mobile
    newH = Math.max(2, Math.round(item.h * 0.7))
  } else if (isTablet) {
    newH = Math.max(1, Math.round(item.h * 0.9))
  } else if (isLargeScreen) {
    newH = Math.max(1, Math.round(item.h * 1.1))
  }

  return {
    i: item.i,
    x: isMobile ? 0 : Math.round(item.x * scale),
    y: item.y,
    w: newW,
    h: newH,
    minW: isMobile ? toCols : item.minW,
    minH: item.minH,
    maxW: isMobile ? toCols : item.maxW,
    maxH: item.maxH,
  }
}

// Auto-arrange algorithm - calculates optimal layout based on screen dimensions
const autoArrangeLayout = (
  items: Layout[],
  cols: number,
  screenWidth: number,
  screenHeight: number
): Layout[] => {
  if (items.length === 0) return []

  // Calculate optimal widget size based on screen and widget count
  const aspectRatio = screenWidth / screenHeight
  const widgetCount = items.length

  // Calculate ideal columns per widget based on aspect ratio
  let idealWidgetCols = Math.max(3, Math.floor(cols / Math.min(4, Math.ceil(Math.sqrt(widgetCount)))))

  // For wider screens, use more columns per widget
  if (aspectRatio > 1.5) {
    idealWidgetCols = Math.max(4, Math.floor(cols / 3))
  }

  // Calculate widgets per row
  const widgetsPerRow = Math.max(1, Math.floor(cols / idealWidgetCols))

  // Calculate ideal height (golden ratio: ~0.618)
  const idealWidgetHeight = Math.max(3, Math.round(idealWidgetCols * 0.618 * 1.5))

  return items.map((item, index) => {
    const row = Math.floor(index / widgetsPerRow)
    const col = index % widgetsPerRow

    // Get default min/max from existing item
    const minW = item.minW || 3
    const minH = item.minH || 2

    // Calculate final dimensions respecting constraints
    const finalW = Math.max(minW, Math.min(idealWidgetCols, cols - col * idealWidgetCols))
    const finalH = Math.max(minH, idealWidgetHeight)

    return {
      i: item.i,
      x: col * idealWidgetCols,
      y: row * idealWidgetHeight,
      w: finalW,
      h: finalH,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
    }
  })
}

// Дефолтные layout для виджетов (копия из widgetLayout.ts для использования в компоненте)
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

// Маппинг виджетов
const widgetComponents: Record<string, React.ComponentType<any>> = {
  'tv-time': TVTimeWidget,
  'media-player': MediaPlayerWidget,
  'spotify': SpotifyWidget,
  'media-room': MediaRoomWidget,
  'canvas': CanvasWidget,
  'tv-preview': TVPreviewWidget,
  'clock': ClockWidget,
  'led': LEDWidget,
  'plex': PlexWidget,
  'tv-duration': TVDurationWidget,
  'weather-calendar': WeatherCalendarWidget,
  'ambient-lighting': AmbientLightingWidget,
  'living-room': LivingRoomWidget,
  'ac': ACWidget,
  'water-heater': WaterHeaterWidget,
  'sensors': SensorsWidget,
  'motors': MotorWidget,
  'bose': BoseWidget,
  'vacuum': VacuumWidget,
  'cameras': CamerasWidget,
}

interface WidgetGridProps {
  currentTab?: string
}

const WidgetGrid = ({ currentTab = 'home' }: WidgetGridProps) => {
  // Определяем количество колонок и высоту строки в зависимости от размера экрана
  const getCols = (): number => {
    if (typeof window === 'undefined') return 12
    if (window.innerWidth < 640) return 4   // Мобильные телефоны (< 640px)
    if (window.innerWidth < 1024) return 6  // Планшеты (640px - 1024px)
    if (window.innerWidth < 1920) return 12 // Лептопы и десктопы (1024px - 1920px)
    return 16  // Большие экраны и телевизоры (>= 1920px)
  }

  const getRowHeight = (): number => {
    if (typeof window === 'undefined') return 60
    if (window.innerWidth < 640) return 50   // Мобильные - компактнее
    if (window.innerWidth < 1024) return 55  // Планшеты
    if (window.innerWidth < 1920) return 60  // Лептопы
    return 70  // Телевизоры - больше для лучшей видимости
  }

  const [layout, setLayout] = useState<Layout[]>([])
  const [_isLayoutLoading, setIsLayoutLoading] = useState(true)

  // Загружаем layout при монтировании или изменении currentTab
  useEffect(() => {
    const loadLayout = async () => {
      setIsLayoutLoading(true)
      try {
        // Переопределяем getInitialLayout внутри useEffect, чтобы использовать актуальный currentTab
        const getLayout = async (): Promise<Layout[]> => {
          // Если выбран конкретный dashboard, загружаем его layout
          if (currentTab && currentTab !== 'home') {
            const navigationIcons = getNavigationIconsSync()

            const dashboardIcon = navigationIcons.find(icon => {
              const dashboardId = icon.dashboardId || icon.id
              return dashboardId === currentTab ||
                icon.id === currentTab ||
                icon.widgetId === currentTab ||
                icon.iconName === currentTab
            })

            if (dashboardIcon) {
              const dashboardId = dashboardIcon.dashboardId || dashboardIcon.id

              const savedLayout = await getDashboardLayoutByDashboardId(dashboardId)
              const currentCols = getCols()
              const savedCols = savedLayout.cols || 12

              // Получаем виджеты, которые добавлены в этот dashboard
              const dashboardWidgets = dashboardIcon.widgets || []

              if (dashboardWidgets.length === 0) {
                return []
              }

              // Получаем layout для существующих виджетов
              const existingLayouts = savedLayout.layouts.filter(l => dashboardWidgets.includes(l.i))
              const existingWidgetIds = new Set(existingLayouts.map(l => l.i))

              // Создаем layout для новых виджетов, которых нет в сохраненном layout
              const newWidgets = dashboardWidgets.filter(widgetId => !existingWidgetIds.has(widgetId))

              const maxY = existingLayouts.length > 0
                ? Math.max(...existingLayouts.map(l => l.y + l.h))
                : -1

              // Используем улучшенные размеры для новых виджетов
              const newLayouts = newWidgets.map((widgetId, index) => {
                const defaultLayout = DEFAULT_LAYOUTS[widgetId] || { x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 }
                // Адаптируем размеры в зависимости от количества колонок
                let optimalW = defaultLayout.w
                let optimalH = defaultLayout.h

                if (currentCols <= 4) {
                  optimalW = currentCols
                  optimalH = Math.max(2, Math.round(defaultLayout.h * 0.7))
                } else if (currentCols <= 6) {
                  optimalW = Math.min(6, Math.max(3, defaultLayout.w))
                  optimalH = Math.max(2, Math.round(defaultLayout.h * 0.9))
                } else if (currentCols >= 16) {
                  optimalW = Math.min(currentCols / 2, defaultLayout.w * 1.2)
                  optimalH = Math.max(3, Math.round(defaultLayout.h * 1.1))
                }

                // Распределяем виджеты равномерно
                const colsPerWidget = Math.floor(currentCols / 3)
                const col = index % 3
                return {
                  i: widgetId,
                  x: col * colsPerWidget,
                  y: maxY + 1 + Math.floor(index / 3) * Math.ceil(optimalH),
                  w: Math.max(defaultLayout.minW || 3, Math.min(optimalW, colsPerWidget)),
                  h: Math.max(defaultLayout.minH || 2, optimalH),
                  minW: defaultLayout.minW,
                  minH: defaultLayout.minH,
                  maxW: defaultLayout.maxW,
                  maxH: defaultLayout.maxH,
                }
              })

              // Объединяем существующие и новые layouts
              const allLayouts = [...existingLayouts, ...newLayouts]

              return allLayouts.map(l => {
                const scale = currentCols / savedCols
                let newW = Math.max(1, Math.round(l.w * scale))
                let newH = l.h

                if (typeof window !== 'undefined' && window.innerWidth < 640) {
                  newW = currentCols
                  newH = Math.max(2, Math.round(l.h * 0.7))
                } else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  newH = Math.max(1, Math.round(l.h * 0.9))
                } else if (typeof window !== 'undefined' && window.innerWidth >= 1920) {
                  newH = Math.max(1, Math.round(l.h * 1.1))
                }

                return {
                  i: l.i,
                  x: (typeof window !== 'undefined' && window.innerWidth < 640) ? 0 : Math.round(l.x * scale),
                  y: l.y,
                  w: newW,
                  h: newH,
                  minW: (typeof window !== 'undefined' && window.innerWidth < 640) ? currentCols : l.minW,
                  minH: l.minH,
                  maxW: (typeof window !== 'undefined' && window.innerWidth < 640) ? currentCols : l.maxW,
                  maxH: l.maxH,
                }
              })
            } else {
              return []
            }
          }

          // Для home загружаем layout с сервера асинхронно
          const savedLayout = await getDashboardLayout()
          const currentCols = getCols()
          const savedCols = savedLayout.cols || 12

          // Если layout пустой, возвращаем пустой массив (layout будет создан автоматически)
          if (!savedLayout.layouts || savedLayout.layouts.length === 0) {
            console.log('[WidgetGrid] Layout пустой, будет создан автоматически')
            return []
          }

          return savedLayout.layouts.map(l => {
            const scale = currentCols / savedCols
            let newW = Math.max(1, Math.round(l.w * scale))
            let newH = l.h

            if (typeof window !== 'undefined' && window.innerWidth < 640) {
              newW = currentCols
              newH = Math.max(2, Math.round(l.h * 0.7))
            } else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              newH = Math.max(1, Math.round(l.h * 0.9))
            } else if (typeof window !== 'undefined' && window.innerWidth >= 1920) {
              newH = Math.max(1, Math.round(l.h * 1.1))
            }

            return {
              i: l.i,
              x: (typeof window !== 'undefined' && window.innerWidth < 640) ? 0 : Math.round(l.x * scale),
              y: l.y,
              w: newW,
              h: newH,
              minW: (typeof window !== 'undefined' && window.innerWidth < 640) ? currentCols : l.minW,
              minH: l.minH,
              maxW: (typeof window !== 'undefined' && window.innerWidth < 640) ? currentCols : l.maxW,
              maxH: l.maxH,
            }
          })
        }

        const loadedLayout = await getLayout()
        console.log('[WidgetGrid] Layout загружен:', {
          layoutCount: loadedLayout.length,
          widgets: loadedLayout.map(l => l.i)
        })

        // Если layout пустой, загружаем его заново с сервера (он должен быть создан автоматически)
        if (loadedLayout.length === 0 && currentTab === 'home') {
          console.log('[WidgetGrid] Layout пустой, загружаем заново с сервера...')
          try {
            const freshLayout = await getDashboardLayout()
            if (freshLayout.layouts && freshLayout.layouts.length > 0) {
              const currentCols = getCols()
              const savedCols = freshLayout.cols || 12
              const mappedLayout = freshLayout.layouts.map(l => {
                const scale = currentCols / savedCols
                let newW = Math.max(1, Math.round(l.w * scale))
                let newH = l.h

                if (typeof window !== 'undefined' && window.innerWidth < 640) {
                  newW = currentCols
                  newH = Math.max(2, Math.round(l.h * 0.7))
                } else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  newH = Math.max(1, Math.round(l.h * 0.9))
                } else if (typeof window !== 'undefined' && window.innerWidth >= 1920) {
                  newH = Math.max(1, Math.round(l.h * 1.1))
                }

                return {
                  i: l.i,
                  x: (typeof window !== 'undefined' && window.innerWidth < 640) ? 0 : Math.round(l.x * scale),
                  y: l.y,
                  w: newW,
                  h: newH,
                  minW: (typeof window !== 'undefined' && window.innerWidth < 640) ? currentCols : l.minW,
                  minH: l.minH,
                  maxW: (typeof window !== 'undefined' && window.innerWidth < 640) ? currentCols : l.maxW,
                  maxH: l.maxH,
                }
              })
              console.log('[WidgetGrid] Обновленный layout загружен:', {
                layoutCount: mappedLayout.length,
                widgets: mappedLayout.map(l => l.i)
              })
              setLayout(mappedLayout)
            } else {
              setLayout(loadedLayout)
            }
          } catch (retryError) {
            console.error('[WidgetGrid] Ошибка повторной загрузки layout:', retryError)
            setLayout(loadedLayout)
          }
        } else {
          setLayout(loadedLayout)
        }
      } catch (error) {
        console.error('Ошибка загрузки layout:', error)
        setLayout([])
      } finally {
        setIsLayoutLoading(false)
      }
    }
    loadLayout()
  }, [currentTab])
  // const [isLoading, setIsLoading] = useState(true)
  const [cols, setCols] = useState(getCols())
  const [rowHeight, setRowHeight] = useState(getRowHeight())
  const [editMode, setEditMode] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const [tripleClickActivated, setTripleClickActivated] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveLayoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Ref для хранения текущего layout в строковом виде для сравнения
  const layoutStrRef = useRef<string>('')

  // Обработка изменения размера окна с debounce для предотвращения зависаний
  useEffect(() => {
    const handleResizeDebounced = debounce(() => {
      const screenWidth = window.innerWidth
      const newCols = getColsForWidth(screenWidth)
      const newRowHeight = getRowHeightForWidth(screenWidth)
      const colsChanged = newCols !== cols
      const rowHeightChanged = newRowHeight !== rowHeight

      if (colsChanged || rowHeightChanged) {
        setCols(newCols)
        setRowHeight(newRowHeight)

        // Пересчитываем layout при изменении размера экрана
        if (colsChanged) {
          setLayout(prevLayout => {
            const oldCols = cols || 12
            const newLayout = prevLayout.map(l => scaleLayoutItem(l, oldCols, newCols, screenWidth))
            layoutStrRef.current = JSON.stringify(newLayout)
            return newLayout
          })
        }
      }
    }, 300) // 300ms debounce для предотвращения лишних ререндеров

    // Слушаем кастомное событие для обновления при изменении виджетов
    const handleWidgetsChanged = async () => {
      setIsLayoutLoading(true)
      try {
        console.log('[WidgetGrid] Received widgets-changed event')
        // В будущем здесь можно добавить логику перезагрузки, если это безопасно
      } catch (e) {
        console.error(e)
      } finally {
        setIsLayoutLoading(false)
      }
    }

    window.addEventListener('widgets-changed', handleWidgetsChanged)
    window.addEventListener('resize', handleResizeDebounced)
    return () => {
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
      window.removeEventListener('resize', handleResizeDebounced)
      // Очищаем таймер сохранения при размонтировании
      if (saveLayoutTimeoutRef.current) {
        clearTimeout(saveLayoutTimeoutRef.current)
      }
    }
  }, [cols, rowHeight, currentTab]) // dependencies

  const handleLayoutChange = useCallback(async (newLayout: Layout[]) => {
    // Проверяем, действительно ли изменился layout
    const newLayoutStr = JSON.stringify(newLayout)
    if (newLayoutStr === layoutStrRef.current) {
      return // Layout не изменился, пропускаем
    }
    layoutStrRef.current = newLayoutStr

    // Определяем dashboardId для текущего таба
    let dashboardId: string | undefined = undefined
    if (currentTab && currentTab !== 'home') {
      const navigationIcons = getNavigationIconsSync()
      const dashboardIcon = navigationIcons.find(icon => {
        const id = icon.dashboardId || icon.id
        return id === currentTab || icon.widgetId === currentTab || icon.iconName === currentTab
      })
      dashboardId = dashboardIcon?.dashboardId
    }
    setLayout(newLayout)

    // Очищаем предыдущий таймер сохранения
    if (saveLayoutTimeoutRef.current) {
      clearTimeout(saveLayoutTimeoutRef.current)
    }

    // Сохраняем layout при изменении с debounce (500ms) для оптимизации
    // Это обеспечивает синхронизацию между устройствами
    saveLayoutTimeoutRef.current = setTimeout(async () => {
      const widgetLayouts: WidgetLayout[] = newLayout.map(l => ({
        i: l.i,
        x: l.x || 0,
        y: l.y || 0,
        w: l.w || 4,
        h: l.h || 2,
        minW: l.minW,
        minH: l.minH,
        maxW: l.maxW,
        maxH: l.maxH,
      }))
      try {
        // Сохраняем layout с текущим количеством колонок и высотой строки
        const currentColsValue = cols || getColsForWidth(window.innerWidth)
        await updateWidgetLayout(widgetLayouts, currentColsValue, rowHeight, dashboardId)
        console.log('[WidgetGrid] Layout сохранен на сервер для синхронизации между устройствами')
      } catch (error) {
        console.error('Ошибка сохранения layout:', error)
      }
    }, 500) // 500ms debounce
  }, [cols, rowHeight, currentTab])


  const TRIPLE_CLICK_TIMEOUT = 500 // 500ms между кликами
  const REQUIRED_CLICKS = 3
  const LONG_PRESS_DURATION = 5000 // 5 секунд

  // Обработка тройного клика
  const handleTripleClick = useCallback((e: MouseEvent) => {
    // Игнорируем клики по интерактивным элементам
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('.react-grid-item') ||
      target.closest('.drag-handle')
    ) {
      return
    }

    clickCountRef.current += 1

    // Сбрасываем таймер
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }

    // Если достигли нужного количества кликов
    if (clickCountRef.current >= REQUIRED_CLICKS) {
      setTripleClickActivated(true)
      clickCountRef.current = 0
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }
      return
    }

    // Устанавливаем таймер для сброса счетчика
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
      clickTimerRef.current = null
    }, TRIPLE_CLICK_TIMEOUT)
  }, [])

  // Обработка долгого нажатия (только после тройного клика)
  const handleLongPressStart = useCallback((e: MouseEvent | TouchEvent) => {
    // Игнорируем если тройной клик не активирован
    if (!tripleClickActivated) {
      return
    }

    // Игнорируем клики по интерактивным элементам
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('.react-grid-item') ||
      target.closest('.drag-handle')
    ) {
      return
    }

    setLongPressProgress(0)

    // Таймер для прогресса
    const startTime = Date.now()
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100)
      setLongPressProgress(progress)
    }, 50)

    // Таймер для активации режима редактирования
    longPressTimerRef.current = setTimeout(() => {
      setEditMode(true)
      setLongPressProgress(0)
      setTripleClickActivated(false)
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }, LONG_PRESS_DURATION)
  }, [tripleClickActivated])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setLongPressProgress(0)
  }, [])

  // Сброс активации тройного клика через 10 секунд
  useEffect(() => {
    if (tripleClickActivated) {
      const timeout = setTimeout(() => {
        setTripleClickActivated(false)
        clickCountRef.current = 0
      }, 10000) // 10 секунд на долгое нажатие
      return () => clearTimeout(timeout)
    }
  }, [tripleClickActivated])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Обработчик тройного клика
    container.addEventListener('click', handleTripleClick)

    // Обработчики долгого нажатия
    container.addEventListener('mousedown', handleLongPressStart)
    container.addEventListener('mouseup', handleLongPressEnd)
    container.addEventListener('mouseleave', handleLongPressEnd)
    container.addEventListener('touchstart', handleLongPressStart)
    container.addEventListener('touchend', handleLongPressEnd)
    container.addEventListener('touchcancel', handleLongPressEnd)

    return () => {
      container.removeEventListener('click', handleTripleClick)
      container.removeEventListener('mousedown', handleLongPressStart)
      container.removeEventListener('mouseup', handleLongPressEnd)
      container.removeEventListener('mouseleave', handleLongPressEnd)
      container.removeEventListener('touchstart', handleLongPressStart)
      container.removeEventListener('touchend', handleLongPressEnd)
      container.removeEventListener('touchcancel', handleLongPressEnd)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [handleTripleClick, handleLongPressStart, handleLongPressEnd])

  // const savedLayout = getDashboardLayoutSync()
  const currentCols = cols || getCols()

  return (
    <div className={`relative ${editMode ? 'edit-mode' : ''}`} ref={containerRef}>
      {/* Индикатор тройного клика */}
      {tripleClickActivated && !editMode && longPressProgress === 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTripleClickActivated(false)
              clickCountRef.current = 0
            }
          }}
        >
          <div className="bg-dark-card rounded-lg p-8 border border-dark-border max-w-md mx-4 relative">
            <button
              onClick={() => {
                setTripleClickActivated(false)
                clickCountRef.current = 0
              }}
              className="absolute top-4 right-4 p-1 hover:bg-dark-cardHover rounded transition-colors"
              title="סגור"
            >
              <X size={20} className="text-dark-textSecondary hover:text-white" />
            </button>
            <div className="text-center">
              <Pencil size={48} className="mx-auto mb-4 text-blue-500" />
              <div className="text-lg font-medium mb-2">לחיצה משולשת הופעלה</div>
              <div className="text-sm text-dark-textSecondary">
                כעת החזק לחיצה למשך 5 שניות להפעלת מצב עריכה
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Индикатор долгого нажатия */}
      {longPressProgress > 0 && !editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-dark-card rounded-lg p-8 border border-dark-border max-w-md mx-4">
            <div className="text-center mb-4">
              <Pencil size={48} className="mx-auto mb-4 text-blue-500" />
              <div className="text-lg font-medium mb-2">הפעלת מצב עריכה</div>
              <div className="text-sm text-dark-textSecondary mb-4">
                החזק להפעלה...
              </div>
              <div className="w-full bg-dark-bg rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-50 ease-linear"
                  style={{ width: `${longPressProgress}%` }}
                />
              </div>
              <div className="text-xs text-dark-textSecondary mt-2">
                {Math.round(longPressProgress)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопки управления в режиме редактирования */}
      {editMode && (
        <div className="fixed top-20 right-6 z-40 flex gap-2">
          {/* Кнопка автоматической сетки */}
          <button
            onClick={() => {
              const screenDims = getScreenDimensions()
              const arrangedLayout = autoArrangeLayout(layout, cols, screenDims.width, screenDims.height)
              setLayout(arrangedLayout)
              // Сохраняем новый layout на сервер
              handleLayoutChange(arrangedLayout)
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg"
            title="Автоматически расположить виджеты по размеру экрана"
          >
            <LayoutGrid size={16} />
            סידור אוטומטי
          </button>
          {/* Кнопка выхода из режима редактирования */}
          <button
            onClick={() => {
              setEditMode(false)
              setTripleClickActivated(false)
              clickCountRef.current = 0
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg"
          >
            <Pencil size={16} />
            סיים עריכה
          </button>
        </div>
      )}

      <GridLayout
        className="layout layout-loaded"
        layout={layout}
        onLayoutChange={handleLayoutChange}
        cols={currentCols}
        rowHeight={rowHeight}
        width={typeof window !== 'undefined' ?
          (window.innerWidth < 640 ? window.innerWidth - 16 :
            window.innerWidth < 1024 ? window.innerWidth - 32 :
              window.innerWidth < 1920 ? window.innerWidth - 80 :
                Math.min(window.innerWidth - 120, 2400)) : 1200}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[8, 8]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {layout
          .map((item) => {
            const WidgetComponent = widgetComponents[item.i]
            if (!WidgetComponent) return null

            // Проверяем, включен ли виджет
            const isEnabled = isWidgetEnabledSync(item.i)
            if (!isEnabled) return null

            return (
              <div key={item.i} className="relative">
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                  <div className="drag-handle cursor-move p-1 bg-dark-cardHover/80 rounded opacity-60 hover:opacity-100 transition-opacity">
                    <GripVertical size={16} className="text-white" />
                  </div>
                </div>
                <div className={`h-full widget-wrapper`}>
                  <div className="widget-card h-full">
                    <WidgetComponent />
                  </div>
                </div>
              </div>
            )
          })}
      </GridLayout>

      {editMode && (
        <div className="mt-4 p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-sm text-blue-200">
          <strong>מצב עריכה:</strong> גרור וידג'טים על ידי האייקון בפינה השמאלית העליונה.
          שנה את הגודל על ידי משיכת הפינות של הווידג'ט.
        </div>
      )}
    </div>
  )
}

export default WidgetGrid
