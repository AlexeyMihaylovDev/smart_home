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
import PlexWidget from './widgets/PlexWidget'
import TVDurationWidget from './widgets/TVDurationWidget'
import AmbientLightingWidget from './widgets/AmbientLightingWidget'
import LivingRoomWidget from './widgets/LivingRoomWidget'
import WeatherCalendarWidget from './widgets/WeatherCalendarWidget'
import ACWidget from './widgets/ACWidget'
import WaterHeaterWidget from './widgets/WaterHeaterWidget'
import SensorsWidget from './widgets/SensorsWidget'
import { getDashboardLayout, updateWidgetLayout, WidgetLayout } from '../services/widgetLayout'
import { GripVertical, Pencil, X } from 'lucide-react'

// Маппинг виджетов
const widgetComponents: Record<string, React.ComponentType<any>> = {
  'tv-time': TVTimeWidget,
  'media-player': MediaPlayerWidget,
  'spotify': SpotifyWidget,
  'media-room': MediaRoomWidget,
  'canvas': CanvasWidget,
  'tv-preview': TVPreviewWidget,
  'plex': PlexWidget,
  'tv-duration': TVDurationWidget,
  'weather-calendar': WeatherCalendarWidget,
  'ambient-lighting': AmbientLightingWidget,
  'living-room': LivingRoomWidget,
  'ac': ACWidget,
  'water-heater': WaterHeaterWidget,
  'sensors': SensorsWidget,
}

const WidgetGrid = () => {
  // Загружаем layout синхронно до первого рендера
  const getInitialLayout = (): Layout[] => {
    const savedLayout = getDashboardLayout()
    return savedLayout.layouts.map(l => ({
      i: l.i,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
      minW: l.minW,
      minH: l.minH,
      maxW: l.maxW,
      maxH: l.maxH,
    }))
  }
  
  const [layout, setLayout] = useState<Layout[]>(getInitialLayout)
  const [isLoading, setIsLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const [tripleClickActivated, setTripleClickActivated] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadLayout = () => {
      const savedLayout = getDashboardLayout()
      const mappedLayout = savedLayout.layouts.map(l => ({
        i: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
        minW: l.minW,
        minH: l.minH,
        maxW: l.maxW,
        maxH: l.maxH,
      }))
      setLayout(mappedLayout)
      setIsLoading(false)
    }
    
    // Загружаем layout сразу, без задержки
    loadLayout()
    
    // Слушаем изменения в localStorage для обновления layout при изменении enabled виджетов
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config' || e.key === 'dashboard_layout') {
        loadLayout()
      }
    }
    
    // Слушаем кастомное событие для обновления при изменении виджетов
    const handleWidgetsChanged = () => {
      loadLayout()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
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
      updateWidgetLayout(widgetLayouts)
    }
  }, [editMode])

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

  const savedLayout = getDashboardLayout()


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
              title="Закрыть"
            >
              <X size={20} className="text-dark-textSecondary hover:text-white" />
            </button>
            <div className="text-center">
              <Pencil size={48} className="mx-auto mb-4 text-blue-500" />
              <div className="text-lg font-medium mb-2">Тройной клик активирован</div>
              <div className="text-sm text-dark-textSecondary">
                Теперь удерживайте нажатие 5 секунд для активации режима редактирования
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
              <div className="text-lg font-medium mb-2">Активация режима редактирования</div>
              <div className="text-sm text-dark-textSecondary mb-4">
                Удерживайте для активации...
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
            Завершить редактирование
          </button>
        </div>
      )}

      <GridLayout
        className="layout layout-loaded"
        layout={layout}
        onLayoutChange={handleLayoutChange}
        cols={savedLayout.cols}
        rowHeight={savedLayout.rowHeight}
        width={typeof window !== 'undefined' ? window.innerWidth - 100 : 1200}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {layout.map((item) => {
          const WidgetComponent = widgetComponents[item.i]
          if (!WidgetComponent) return null

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
          <strong>Режим редактирования:</strong> Перетаскивайте виджеты за иконку в левом верхнем углу. 
          Изменяйте размер, потянув за углы виджета.
        </div>
      )}
    </div>
  )
}

export default WidgetGrid
