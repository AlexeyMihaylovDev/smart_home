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
import { getDashboardLayout, getDashboardLayoutSync, updateWidgetLayout, saveDashboardLayout, WidgetLayout, getDashboardLayoutByDashboardId } from '../services/widgetLayout'
import { isWidgetEnabledSync, getNavigationIconsSync } from '../services/widgetConfig'
import { GripVertical, Pencil, X } from 'lucide-react'

// Дефолтные layout для виджетов (копия из widgetLayout.ts для использования в компоненте)
const DEFAULT_LAYOUTS: Record<string, Omit<WidgetLayout, 'i'>> = {
  'tv-time': { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  'media-player': { x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  'spotify': { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
  'media-room': { x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
  'canvas': { x: 4, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
  'tv-preview': { x: 8, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
  'clock': { x: 0, y: 4, w: 4, h: 3, minW: 2, minH: 2 },
  'led': { x: 4, y: 4, w: 4, h: 3, minW: 2, minH: 2 },
  'plex': { x: 0, y: 7, w: 4, h: 2, minW: 2, minH: 2 },
  'tv-duration': { x: 4, y: 6, w: 4, h: 2, minW: 2, minH: 2 },
  'weather-calendar': { x: 8, y: 6, w: 4, h: 6, minW: 1, minH: 1 },
  'ambient-lighting': { x: 0, y: 6, w: 4, h: 4, minW: 2, minH: 3 },
  'living-room': { x: 0, y: 10, w: 4, h: 3, minW: 2, minH: 2 },
  'ac': { x: 4, y: 10, w: 4, h: 5, minW: 3, minH: 4 },
  'water-heater': { x: 8, y: 10, w: 4, h: 5, minW: 1, minH: 1 },
  'sensors': { x: 0, y: 13, w: 4, h: 4, minW: 2, minH: 3 },
  'motors': { x: 4, y: 13, w: 4, h: 4, minW: 1, minH: 1 },
  'bose': { x: 8, y: 13, w: 4, h: 5, minW: 2, minH: 3 },
  'vacuum': { x: 0, y: 18, w: 6, h: 8, minW: 3, minH: 5 },
  'cameras': { x: 0, y: 18, w: 6, h: 8, minW: 3, minH: 5 },
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
  const [isLayoutLoading, setIsLayoutLoading] = useState(true)
  
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
              
              const newLayouts = newWidgets.map((widgetId, index) => {
                const defaultLayout = DEFAULT_LAYOUTS[widgetId] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }
                return {
                  i: widgetId,
                  ...defaultLayout,
                  y: maxY + 1 + index,
                  x: (index % 3) * 4
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
          
          // Для home используем старый способ
          const savedLayout = getDashboardLayoutSync()
          const currentCols = getCols()
          const savedCols = savedLayout.cols || 12
          
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
        setLayout(loadedLayout)
      } catch (error) {
        console.error('Ошибка загрузки layout:', error)
        setLayout([])
      } finally {
        setIsLayoutLoading(false)
      }
    }
    loadLayout()
  }, [currentTab])
  const [isLoading, setIsLoading] = useState(true)
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

  // Обработка изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      const newCols = getCols()
      const newRowHeight = getRowHeight()
      const colsChanged = newCols !== cols
      const rowHeightChanged = newRowHeight !== rowHeight
      
      if (colsChanged || rowHeightChanged) {
        setCols(newCols)
        setRowHeight(newRowHeight)
        
        // Пересчитываем layout при изменении размера экрана
        if (colsChanged) {
          setLayout(prevLayout => {
            const oldCols = cols || 12
            const scale = newCols / oldCols
            
            return prevLayout.map(l => {
              let newW = Math.max(1, Math.round(l.w * scale))
              let newH = l.h
              
              // Для мобильных устройств делаем виджеты на всю ширину
              if (window.innerWidth < 640) {
                newW = newCols
                newH = Math.max(2, Math.round(l.h * 0.7))
              } else if (window.innerWidth < 1024) {
                newH = Math.max(1, Math.round(l.h * 0.9))
              } else if (window.innerWidth >= 1920) {
                newH = Math.max(1, Math.round(l.h * 1.1))
              }
              
              return {
                ...l,
                x: window.innerWidth < 640 ? 0 : Math.round(l.x * scale),
                w: newW,
                h: newH,
                minW: window.innerWidth < 640 ? newCols : l.minW,
                maxW: window.innerWidth < 640 ? newCols : l.maxW,
              }
            })
          })
        }
      }
    }
    
    // Слушаем кастомное событие для обновления при изменении виджетов
    const handleWidgetsChanged = async () => {
      setIsLayoutLoading(true)
      try {
        // Используем ту же логику, что и в основном useEffect
        const getLayout = async (): Promise<Layout[]> => {
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
              const dashboardWidgets = dashboardIcon.widgets || []
              
              if (dashboardWidgets.length === 0) return []
              
              const existingLayouts = savedLayout.layouts.filter(l => dashboardWidgets.includes(l.i))
              const existingWidgetIds = new Set(existingLayouts.map(l => l.i))
              const newWidgets = dashboardWidgets.filter(widgetId => !existingWidgetIds.has(widgetId))
              const maxY = existingLayouts.length > 0 ? Math.max(...existingLayouts.map(l => l.y + l.h)) : -1
              
              const newLayouts = newWidgets.map((widgetId, index) => {
                const defaultLayout = DEFAULT_LAYOUTS[widgetId] || { x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 }
                return {
                  i: widgetId,
                  ...defaultLayout,
                  y: maxY + 1 + index,
                  x: (index % 3) * 4
                }
              })
              
              return [...existingLayouts, ...newLayouts].map(l => ({
                ...l,
                minW: l.minW,
                minH: l.minH,
                maxW: l.maxW,
                maxH: l.maxH,
              }))
            }
            return []
          }
          
          const savedLayout = getDashboardLayoutSync()
          return savedLayout.layouts
        }
        
        const loadedLayout = await getLayout()
        setLayout(loadedLayout)
      } catch (error) {
        console.error('Ошибка загрузки layout:', error)
        setLayout([])
      } finally {
        setIsLayoutLoading(false)
      }
    }
    
    window.addEventListener('widgets-changed', handleWidgetsChanged)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
      window.removeEventListener('resize', handleResize)
    }
  }, [cols, rowHeight, currentTab])

  const handleLayoutChange = useCallback(async (newLayout: Layout[]) => {
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
    // Сохраняем layout при изменении (только в режиме редактирования)
    // В обычном режиме react-grid-layout сам компактирует через compactType
    if (editMode) {
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
        const currentColsValue = cols || getCols()
        await updateWidgetLayout(widgetLayouts, currentColsValue, rowHeight, dashboardId)
      } catch (error) {
        console.error('Ошибка сохранения layout:', error)
      }
    }
  }, [editMode, cols, rowHeight, currentTab])

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

  const savedLayout = getDashboardLayoutSync()
  const currentCols = cols || getCols()

  return (
    <div className="relative" ref={containerRef}>
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

      {/* Кнопка выхода из режима редактирования */}
      {editMode && (
        <div className="fixed top-20 right-6 z-40">
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
        isDraggable={editMode}
        isResizable={editMode}
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
                {editMode && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                    <div className="drag-handle cursor-move p-1 bg-dark-cardHover rounded opacity-75 hover:opacity-100">
                      <GripVertical size={16} className="text-white" />
                    </div>
                    <div className="px-2 py-1 bg-dark-cardHover rounded text-xs text-white opacity-75">
                      {item.w}×{item.h}
                    </div>
                  </div>
                )}
                <div className={`h-full ${editMode ? 'opacity-90' : ''} widget-wrapper`}>
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
