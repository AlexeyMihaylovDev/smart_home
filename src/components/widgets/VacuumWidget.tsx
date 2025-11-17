import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getVacuumConfigsSync, VacuumConfig } from '../../services/widgetConfig'
import { getConnectionConfig } from '../../services/apiService'
import { 
  Play, Pause, Square, Home, Battery, Map as MapIcon, 
  Clock, Settings, ChevronDown, ChevronUp, 
  RefreshCw, Navigation, Zap, Activity, 
  Gauge, Timer, Ruler, AlertCircle, CheckCircle2,
  ZoomIn, ZoomOut, RotateCcw, Box, Droplet, Wind,
  Info, Database, Calendar, Hash, Menu, X, MapPin,
  Target, Layers, Wrench, Power, RotateCw
} from 'lucide-react'

interface VacuumUnitProps {
  vacuumConfig: VacuumConfig
  entity: Entity | null
  mapEntity: Entity | null
  relatedEntities: Map<string, Entity>
  api: any
  loading: boolean
  onLoadingChange: (loading: boolean) => void
}

const VacuumUnit = ({ vacuumConfig, entity, mapEntity, relatedEntities, api, loading, onLoadingChange }: VacuumUnitProps) => {
  const [localLoading, setLocalLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showServicesMenu, setShowServicesMenu] = useState(false)
  const [showStartOptions, setShowStartOptions] = useState(false)
  const [selectedCleaningType, setSelectedCleaningType] = useState<string>('auto')
  const [cleaningRepeats, setCleaningRepeats] = useState<number>(1)
  const [roomSelectionMode, setRoomSelectionMode] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<Set<string | number>>(new Set())
  const [currentMode, setCurrentMode] = useState<string>('') // Текущий активный режим
  const [mapImage, setMapImage] = useState<string | null>(null)
  const [mapError, setMapError] = useState(false)
  const [mapRefreshKey, setMapRefreshKey] = useState(0)
  const [mapZoom, setMapZoom] = useState(1) // Уровень зума (1 = 100%)
  const [map3D, setMap3D] = useState(false) // Режим 3D
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 }) // Позиция карты для перетаскивания
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [haBaseUrl, setHaBaseUrl] = useState<string>('')

  // Загружаем базовый URL Home Assistant
  useEffect(() => {
    const loadHABaseUrl = async () => {
      try {
        const connection = await getConnectionConfig()
        if (connection?.url) {
          setHaBaseUrl(connection.url.replace(/\/$/, ''))
        } else {
          // Fallback на текущий хост
          setHaBaseUrl(`${window.location.protocol}//${window.location.hostname}:8123`)
        }
      } catch (error) {
        console.error('Ошибка загрузки URL Home Assistant:', error)
        // Fallback на текущий хост
        setHaBaseUrl(`${window.location.protocol}//${window.location.hostname}:8123`)
      }
    }
    loadHABaseUrl()
  }, [])

  // Функция для правильного добавления параметра времени к URL
  const addTimestampToUrl = (url: string): string => {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}t=${Date.now()}`
  }

  // Функции для управления зумом
  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 0.25, 3)) // Максимум 300%
  }

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 0.25, 0.5)) // Минимум 50%
  }

  const handleZoomReset = () => {
    setMapZoom(1)
    setMapPosition({ x: 0, y: 0 })
  }

  // Обработка колеса мыши для зума
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setMapZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  // Обработка перетаскивания карты
  const handleMouseDown = (e: React.MouseEvent) => {
    // В режиме выбора комнат не перетаскиваем карту
    if (roomSelectionMode) return
    if (mapZoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && mapZoom > 1) {
      setMapPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Обработка touch-жестов для мобильных устройств
  const handleTouchStart = (e: React.TouchEvent) => {
    // В режиме выбора комнат не перетаскиваем карту
    if (roomSelectionMode) return
    if (mapZoom > 1 && e.touches.length === 1) {
      setIsDragging(true)
      const touch = e.touches[0]
      setDragStart({ x: touch.clientX - mapPosition.x, y: touch.clientY - mapPosition.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && mapZoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0]
      setMapPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Получаем URL для 3D карты (если доступно)
  const getMapUrl = (): string | null => {
    if (!mapImage) return null
    
    if (map3D) {
      // Пробуем найти 3D версию карты в атрибутах
      const map3DUrl = mapEntity?.attributes.map_3d || 
                       mapEntity?.attributes.map_image_3d ||
                       entity?.attributes.map_3d ||
                       entity?.attributes.map_image_3d
      
      if (map3DUrl) {
        if (!map3DUrl.startsWith('http')) {
          return map3DUrl.startsWith('/') ? `${haBaseUrl}${map3DUrl}` : `${haBaseUrl}/${map3DUrl}`
        }
        return map3DUrl
      }
      
      // Если 3D версии нет, используем обычную карту с 3D эффектом
      return mapImage
    }
    
    return mapImage
  }

  useEffect(() => {
    if (!haBaseUrl) return // Ждем загрузки базового URL
    
    setMapError(false)
    
    // Загружаем карту из map entity или из основного entity
    if (mapEntity) {
      // Пробуем разные атрибуты для карты
      let mapUrl = mapEntity.attributes.map_image || 
                   mapEntity.attributes.entity_picture || 
                   mapEntity.attributes.image
      
      if (mapUrl) {
        // Если URL относительный, делаем его абсолютным
        if (!mapUrl.startsWith('http')) {
          mapUrl = mapUrl.startsWith('/') ? `${haBaseUrl}${mapUrl}` : `${haBaseUrl}/${mapUrl}`
        }
        setMapImage(mapUrl)
      } else if (mapEntity.entity_id.startsWith('camera.') || mapEntity.entity_id.startsWith('image.')) {
        // Для camera/image entities используем proxy
        const fullUrl = `${haBaseUrl}/api/camera_proxy/${mapEntity.entity_id}`
        setMapImage(fullUrl)
      } else {
        setMapImage(null)
      }
    } else if (entity) {
      const mapUrl = entity.attributes.map_image || 
                     entity.attributes.entity_picture || 
                     entity.attributes.image
      if (mapUrl) {
        // Если URL относительный, делаем его абсолютным
        const fullUrl = mapUrl.startsWith('http') 
          ? mapUrl 
          : (mapUrl.startsWith('/') ? `${haBaseUrl}${mapUrl}` : `${haBaseUrl}/${mapUrl}`)
        setMapImage(fullUrl)
      } else {
        setMapImage(null)
      }
    } else {
      setMapImage(null)
    }
  }, [entity, mapEntity, haBaseUrl])

  const state = entity?.state || 'unknown'
  const isCleaning = state === 'cleaning'
  const isPaused = state === 'paused'
  const isDocked = state === 'docked' || state === 'idle'
  const isReturning = state === 'returning'
  const batteryLevel = entity?.attributes.battery_level || entity?.attributes.battery || 0
  const status = entity?.attributes.status || state
  const fanSpeed = entity?.attributes.fan_speed || entity?.attributes.fan_speed_list?.[0] || 'Auto'
  const fanSpeedList = entity?.attributes.fan_speed_list || []
  const currentRoom = entity?.attributes.current_room
  const friendlyName = vacuumConfig.name || entity?.attributes.friendly_name || vacuumConfig.entityId || 'Vacuum'
  
  // Дополнительная информация из атрибутов
  const cleanedArea = entity?.attributes.cleaned_area
  const cleaningTime = entity?.attributes.cleaning_time
  const totalCleanedArea = entity?.attributes.total_cleaned_area
  const totalCleaningTime = entity?.attributes.total_cleaning_time
  const error = entity?.attributes.error
  const errorMessage = entity?.attributes.error_message
  const mainBrushLife = entity?.attributes.main_brush_life
  const sideBrushLife = entity?.attributes.side_brush_life
  const filterLife = entity?.attributes.filter_life
  const sensorDirtyLife = entity?.attributes.sensor_dirty_life
  
  // Дополнительные важные атрибуты из Dreame vacuum
  const waterBoxLife = entity?.attributes.water_box_life
  const mopLife = entity?.attributes.mop_life
  const mopPadLife = entity?.attributes.mop_pad_life
  const dustCollectionLife = entity?.attributes.dust_collection_life
  const cleaningCount = entity?.attributes.cleaning_count
  const totalCleaningCount = entity?.attributes.total_cleaning_count
  const lastCleaningTime = entity?.attributes.last_cleaning_time
  const mapName = entity?.attributes.map_name
  const doNotDisturb = entity?.attributes.do_not_disturb
  const fanSpeedLevel = entity?.attributes.fan_speed_level
  const waterLevel = entity?.attributes.water_level
  const carpetMode = entity?.attributes.carpet_mode
  const obstacleAvoidance = entity?.attributes.obstacle_avoidance
  const voicePack = entity?.attributes.voice_pack
  const firmwareVersion = entity?.attributes.firmware_version
  const serialNumber = entity?.attributes.serial_number
  const model = entity?.attributes.model
  
  // Получаем данные из связанных entities (ищем по паттернам)
  const getRelatedEntityValue = (pattern: string): string | undefined => {
    for (const [id, entity] of relatedEntities.entries()) {
      if (id.toLowerCase().includes(pattern.toLowerCase())) {
        return entity.state
      }
    }
    return undefined
  }
  
  const mappingTime = getRelatedEntityValue('mapping_time') || getRelatedEntityValue('mapping')
  const cleanedAreaSensor = getRelatedEntityValue('cleaned_area')
  const cleaningTimeSensor = getRelatedEntityValue('cleaning_time')
  
  // Форматируем время
  const formatTime = (time: any): string => {
    if (!time) return '-'
    if (typeof time === 'number') {
      const hours = Math.floor(time / 3600)
      const minutes = Math.floor((time % 3600) / 60)
      return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`
    }
    return String(time)
  }
  
  // Форматируем площадь
  const formatArea = (area: any): string => {
    if (!area) return '-'
    if (typeof area === 'number') {
      return `${area.toFixed(1)} м²`
    }
    return String(area)
  }
  
  // Автообновление карты каждые 5 секунд во время уборки
  useEffect(() => {
    if (isCleaning && mapImage && !mapError) {
      const interval = setInterval(() => {
        setMapRefreshKey(prev => prev + 1)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isCleaning, mapImage, mapError])

  const handleStart = async (cleaningType?: string, repeats?: number) => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      const serviceData: any = {}
      
      // Добавляем параметры типа уборки и количества повторений
      if (cleaningType) {
        serviceData.cleaning_mode = cleaningType
      }
      if (repeats && repeats > 1) {
        serviceData.repeats = repeats
      }

      await api.callService({
        domain: 'vacuum',
        service: 'start',
        target: { entity_id: vacuumConfig.entityId },
        service_data: Object.keys(serviceData).length > 0 ? serviceData : undefined
      })
    } catch (error) {
      console.error('Ошибка запуска пылесоса:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
      setShowStartOptions(false)
    }
  }

  const handlePause = async () => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'pause',
        target: { entity_id: vacuumConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка паузы пылесоса:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleStop = async () => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'stop',
        target: { entity_id: vacuumConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка остановки пылесоса:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleReturnToBase = async () => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'return_to_base',
        target: { entity_id: vacuumConfig.entityId },
      })
    } catch (error) {
      console.error('Ошибка возврата на базу:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleSetFanSpeed = async (speed: string) => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'set_fan_speed',
        target: { entity_id: vacuumConfig.entityId },
        service_data: { fan_speed: speed }
      })
    } catch (error) {
      console.error('Ошибка установки скорости вентилятора:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleCleanRoom = async (roomId: string | number) => {
    if (!api || !vacuumConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'vacuum',
        service: 'clean_spot',
        target: { entity_id: vacuumConfig.entityId },
        service_data: { room: roomId }
      })
    } catch (error) {
      // Пробуем альтернативный сервис
      try {
        await api.callService({
          domain: 'vacuum',
          service: 'send_command',
          target: { entity_id: vacuumConfig.entityId },
          service_data: { 
            command: 'app_segment_clean',
            params: [roomId]
          }
        })
      } catch (error2) {
        console.error('Ошибка уборки комнаты:', error2)
      }
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  // Универсальная функция для вызова сервисов Dreame
  const callDreameService = async (service: string, serviceData?: any, serviceLabel?: string) => {
    if (!api || !vacuumConfig.entityId) return

    // Специальная обработка для app_segment_clean - включаем режим выбора комнат на карте
    if (service === 'app_segment_clean') {
      setRoomSelectionMode(true)
      setSelectedRooms(new Set())
      setCurrentMode(serviceLabel || 'בחירת חדרים')
      setShowServicesMenu(false)
      return
    }

    // Устанавливаем текущий режим
    setCurrentMode(serviceLabel || service)
    setLocalLoading(true)
    onLoadingChange(true)
    try {
      // Пробуем сначала через domain dreame_vacuum
      try {
        await api.callService({
          domain: 'dreame_vacuum',
          service: service,
          target: { entity_id: vacuumConfig.entityId },
          service_data: serviceData || {}
        })
      } catch (error) {
        // Если не работает, пробуем через vacuum domain
        await api.callService({
          domain: 'vacuum',
          service: service,
          target: { entity_id: vacuumConfig.entityId },
          service_data: serviceData || {}
        })
      }
    } catch (error) {
      console.error(`Ошибка вызова сервиса ${service}:`, error)
      setCurrentMode('') // Сбрасываем режим при ошибке
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
      setShowServicesMenu(false)
      // Сбрасываем режим через 3 секунды после успешного выполнения
      setTimeout(() => {
        setCurrentMode('')
      }, 3000)
    }
  }

  // Обработчик клика на комнату на карте
  const handleRoomClick = (roomId: string | number, roomEntityId?: string) => {
    if (!roomSelectionMode) return
    
    const newSelected = new Set(selectedRooms)
    if (newSelected.has(roomId)) {
      newSelected.delete(roomId)
    } else {
      newSelected.add(roomId)
    }
    setSelectedRooms(newSelected)
  }

  // Функция для запуска уборки выбранных комнат
  const handleCleanSelectedRooms = async () => {
    if (!api || !vacuumConfig.entityId || selectedRooms.size === 0) return

    setLocalLoading(true)
    onLoadingChange(true)
    const roomsArray = Array.from(selectedRooms)
    setRoomSelectionMode(false)
    setSelectedRooms(new Set())
    
    try {
      // Проверяем, есть ли Customized room cleaning entities (firmware 1156+)
      const roomEntities = Array.from(relatedEntities.values()).filter(e => {
        const eId = e.entity_id.toLowerCase()
        return eId.includes('_room_')
      })
      
      // Если есть room entities, используем их для уборки
      if (roomEntities.length > 0) {
        const selectedRoomEntities = roomEntities.filter(e => {
          const roomIdMatch = e.entity_id.match(/_room_(\d+)/i)
          if (!roomIdMatch) return false
          const roomId = parseInt(roomIdMatch[1])
          return roomsArray.includes(roomId) || roomsArray.includes(String(roomId))
        })
        
        // Вызываем сервис для каждой выбранной комнаты через её entity
        for (const roomEntity of selectedRoomEntities) {
          try {
            // Пробуем вызвать сервис через room entity (если это button или switch)
            if (roomEntity.entity_id.startsWith('button.')) {
              await api.callService({
                domain: 'button',
                service: 'press',
                target: { entity_id: roomEntity.entity_id }
              })
            } else if (roomEntity.entity_id.startsWith('switch.')) {
              await api.callService({
                domain: 'switch',
                service: 'turn_on',
                target: { entity_id: roomEntity.entity_id }
              })
            } else if (roomEntity.entity_id.startsWith('vacuum.')) {
              // Если это vacuum entity для комнаты, используем стандартный способ
              await api.callService({
                domain: 'vacuum',
                service: 'start',
                target: { entity_id: roomEntity.entity_id }
              })
            }
          } catch (error) {
            console.error(`Ошибка вызова сервиса для комнаты ${roomEntity.entity_id}:`, error)
          }
        }
        
        // Если вызвали через room entities, выходим
        if (selectedRoomEntities.length > 0) {
          return
        }
      }
      
      // Иначе используем стандартный способ через segments
      try {
        await api.callService({
          domain: 'dreame_vacuum',
          service: 'app_segment_clean',
          target: { entity_id: vacuumConfig.entityId },
          service_data: { segments: roomsArray }
        })
      } catch (error) {
        // Пробуем альтернативный способ
        try {
          await api.callService({
            domain: 'vacuum',
            service: 'send_command',
            target: { entity_id: vacuumConfig.entityId },
            service_data: { 
              command: 'app_segment_clean',
              params: roomsArray
            }
          })
        } catch (error2) {
          // Последняя попытка - через clean_spot с параметром room
          if (roomsArray.length === 1) {
            await api.callService({
              domain: 'vacuum',
              service: 'clean_spot',
              target: { entity_id: vacuumConfig.entityId },
              service_data: { room: roomsArray[0] }
            })
          } else {
            throw error2
          }
        }
      }
    } catch (error) {
      console.error('Ошибка уборки комнат:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  // Список сервисов Dreame vacuum
  const dreameServices = [
    { id: 'locate', label: 'מצא שואב אבק', icon: MapPin, description: 'מפעיל צליל כדי למצוא את השואב אבק' },
    { id: 'clean_spot', label: 'ניקוי נקודה', icon: Target, description: 'ניקוי נקודה ספציפית' },
    { id: 'app_goto_target', label: 'לך לנקודה', icon: Navigation, description: 'לך לנקודה ספציפית על המפה' },
    { id: 'app_zoned_clean', label: 'ניקוי אזור', icon: Layers, description: 'ניקוי אזור מסוים' },
    { id: 'app_segment_clean', label: 'ניקוי חדר', icon: Box, description: 'ניקוי חדר ספציפי' },
    { id: 'reset_main_brush_life', label: 'איפוס מברשת ראשית', icon: RotateCw, description: 'איפוס מונה חיי מברשת ראשית' },
    { id: 'reset_side_brush_life', label: 'איפוס מברשת צד', icon: RotateCw, description: 'איפוס מונה חיי מברשת צד' },
    { id: 'reset_filter_life', label: 'איפוס מסנן', icon: RotateCw, description: 'איפוס מונה חיי מסנן' },
    { id: 'reset_sensor_dirty_life', label: 'איפוס חיישן לכלוך', icon: RotateCw, description: 'איפוס מונה חיי חיישן לכלוך' },
    { id: 'reset_water_box_life', label: 'איפוס מיכל מים', icon: RotateCw, description: 'איפוס מונה חיי מיכל מים' },
    { id: 'reset_mop_life', label: 'איפוס סמרטוט', icon: RotateCw, description: 'איפוס מונה חיי סמרטוט' },
    { id: 'reset_dust_collection_life', label: 'איפוס מיכל אבק', icon: RotateCw, description: 'איפוס מונה חיי מיכל אבק' },
  ]
  
  // Функция для вызова сервиса с меткой
  const handleServiceClick = (service: typeof dreameServices[0]) => {
    callDreameService(service.id, undefined, service.label)
  }

  const getRooms = (): Array<{ 
    id: string | number, 
    name: string, 
    x?: number, 
    y?: number, 
    icon?: string,
    polygon?: Array<{x: number, y: number}>,
    bounds?: {minX: number, minY: number, maxX: number, maxY: number}
  }> => {
    if (!entity) return []
    
    // Пробуем разные источники данных о комнатах
    const rooms = entity.attributes.rooms || 
                  entity.attributes.room_list || 
                  entity.attributes.segments ||
                  entity.attributes.map_segments || []
    
    if (Array.isArray(rooms)) {
      return rooms.map((room: any) => {
        // Получаем координаты из разных возможных полей
        const x = room.x || room.center_x || room.position_x || room.center?.x
        const y = room.y || room.center_y || room.position_y || room.center?.y
        
        // Получаем полигон комнаты (если есть)
        const polygon = room.polygon || room.outline || room.boundary
        
        // Вычисляем границы комнаты
        let bounds = undefined
        if (polygon && Array.isArray(polygon) && polygon.length > 0) {
          const xs = polygon.map((p: any) => p.x || p[0] || 0)
          const ys = polygon.map((p: any) => p.y || p[1] || 0)
          bounds = {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys)
          }
        }
        
        return {
          id: room.id || room.segment_id || room.segment || room,
          name: room.name || room.label || room.friendly_name || `Room ${room.id || room.segment_id || room}`,
          x,
          y,
          icon: room.icon,
          polygon,
          bounds
        }
      }).filter(room => room.id !== undefined && room.id !== null)
    }
    
    // Если комнаты не найдены, пробуем получить из related entities (Customized room cleaning entities)
    if (relatedEntities && relatedEntities.size > 0) {
      const roomEntities = Array.from(relatedEntities.values()).filter(e => {
        const eId = e.entity_id.toLowerCase()
        // Ищем room entities: vacuum.{name}_room_{id}, button.{name}_room_{id}, switch.{name}_room_{id}
        return eId.includes('_room_') || 
               eId.includes('room') || 
               eId.includes('segment') ||
               (e.entity_id.startsWith('button.') && e.attributes.friendly_name?.toLowerCase().includes('room'))
      })
      
      return roomEntities.map((e: Entity) => {
        // Извлекаем ID комнаты из entity_id (например, из vacuum.x50_ultra_complete_room_1 получаем 1)
        const roomIdMatch = e.entity_id.match(/_room_(\d+)/i)
        const roomId = roomIdMatch ? parseInt(roomIdMatch[1]) : e.entity_id
        
        return {
          id: roomId,
          name: e.attributes.friendly_name || 
                e.attributes.name || 
                e.entity_id.split('.').slice(1).join('.').replace(/_room_\d+/i, ''),
          x: e.attributes.x || e.attributes.center_x || e.attributes.position_x,
          y: e.attributes.y || e.attributes.center_y || e.attributes.position_y,
          entityId: e.entity_id // Сохраняем entity_id для вызова сервиса
        }
      })
    }
    
    return []
  }

  const rooms = getRooms()

  const getBatteryColor = (level: number): string => {
    if (level > 50) return 'text-green-400'
    if (level > 20) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBatteryIcon = (level: number) => {
    if (level > 75) return Battery
    if (level > 50) return Battery
    if (level > 25) return Battery
    return Battery
  }

  const BatteryIcon = getBatteryIcon(batteryLevel)

  if (!entity) {
    return (
      <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
        <div className="text-center text-dark-textSecondary">
          <div className="text-sm mb-1">{friendlyName}</div>
          <div className="text-xs">לא מחובר</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-blue-500/50 transition-all overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
            isCleaning ? 'bg-green-500/20' : 
            isPaused ? 'bg-yellow-500/20' : 
            isDocked ? 'bg-blue-500/20' : 
            'bg-gray-500/20'
          }`}>
            <Navigation size={16} className={`sm:w-[18px] sm:h-[18px] ${
              isCleaning ? 'text-green-400' : 
              isPaused ? 'text-yellow-400' : 
              isDocked ? 'text-blue-400' : 
              'text-gray-400'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm sm:text-base text-white truncate" title={friendlyName}>
              {friendlyName}
            </div>
            <div className="text-[10px] sm:text-xs text-dark-textSecondary truncate">
              {status}
            </div>
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-dark-card border border-dark-border flex-shrink-0 ${getBatteryColor(batteryLevel)}`}>
            <BatteryIcon size={12} />
            <span className="text-[10px] font-medium">{batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Карта дома - улучшенное отображение с зумом и 3D */}
      {mapImage && !mapError && (
        <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden border-2 border-blue-500/30 bg-dark-card shadow-lg relative">
          {/* Элементы управления картой */}
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
            {/* Переключатель 2D/3D */}
            <button
              onClick={() => setMap3D(!map3D)}
              className={`p-2 rounded-lg backdrop-blur-md shadow-lg transition-all ${
                map3D 
                  ? 'bg-blue-600/90 text-white' 
                  : 'bg-dark-card/90 text-dark-textSecondary hover:text-white'
              }`}
              title={map3D ? 'Переключить на 2D' : 'Переключить на 3D'}
            >
              <Box size={16} />
            </button>
            
            {/* Кнопки зума */}
            <div className="flex flex-col gap-1 bg-dark-card/90 backdrop-blur-md rounded-lg p-1">
              <button
                onClick={handleZoomIn}
                disabled={mapZoom >= 3}
                className="p-1.5 rounded text-white hover:bg-dark-cardHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Приблизить"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleZoomOut}
                disabled={mapZoom <= 0.5}
                className="p-1.5 rounded text-white hover:bg-dark-cardHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Отдалить"
              >
                <ZoomOut size={14} />
              </button>
              {mapZoom !== 1 && (
                <button
                  onClick={handleZoomReset}
                  className="p-1.5 rounded text-white hover:bg-dark-cardHover transition-colors"
                  title="Сбросить зум"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
            
            {/* Индикатор уровня зума */}
            {mapZoom !== 1 && (
              <div className="px-2 py-1 bg-dark-card/90 backdrop-blur-md rounded text-xs text-white text-center">
                {Math.round(mapZoom * 100)}%
              </div>
            )}
          </div>
          
          {/* Индикатор режима выбора комнат */}
          {roomSelectionMode && (
            <div className="absolute top-2 left-2 z-30 px-3 py-2 bg-green-600/90 backdrop-blur-md rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto">
              <Target size={14} className="text-white" />
              <span className="text-xs font-medium text-white">בחר חדרים על המפה</span>
              <button
                onClick={() => {
                  setRoomSelectionMode(false)
                  setSelectedRooms(new Set())
                  setCurrentMode('')
                }}
                className="ml-2 p-1 hover:bg-green-700 rounded transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
          
          {/* Индикатор текущего режима работы */}
          {currentMode && !roomSelectionMode && (
            <div className="absolute top-2 left-2 z-30 px-3 py-2 bg-blue-600/90 backdrop-blur-md rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto">
              <Activity size={14} className="text-white" />
              <span className="text-xs font-medium text-white">{currentMode}</span>
            </div>
          )}
          
          {/* Список выбранных комнат */}
          {roomSelectionMode && selectedRooms.size > 0 && (
            <div className="absolute bottom-2 left-2 right-2 z-20 bg-dark-card/95 backdrop-blur-md rounded-lg shadow-lg p-2 max-h-32 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white">
                  נבחרו {selectedRooms.size} חדרים
                </span>
                <button
                  onClick={handleCleanSelectedRooms}
                  disabled={localLoading || loading}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Play size={12} />
                  התחל ניקוי
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedRooms).map((roomId) => {
                  const room = rooms.find(r => r.id === roomId)
                  return room ? (
                    <div
                      key={roomId}
                      className="px-2 py-1 bg-green-600/30 border border-green-500/50 rounded text-xs text-white flex items-center gap-1.5"
                    >
                      <Box size={12} />
                      {room.name}
                      <button
                        onClick={() => handleRoomClick(roomId)}
                        className="ml-1 hover:bg-green-600/50 rounded p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Контейнер карты с возможностью зума и перетаскивания */}
          <div 
            className="relative w-full bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 overflow-hidden"
            style={{ 
              aspectRatio: '1', 
              minHeight: '200px', 
              maxHeight: '400px',
              cursor: roomSelectionMode ? 'crosshair' : (mapZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default')
            }}
            onWheel={!roomSelectionMode ? handleWheel : undefined}
            onMouseDown={(e) => {
              if (roomSelectionMode) {
                // В режиме выбора комнат не перетаскиваем карту
                e.stopPropagation()
                return
              }
              handleMouseDown(e)
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              if (roomSelectionMode) {
                // В режиме выбора комнат не перетаскиваем карту
                e.stopPropagation()
                return
              }
              handleTouchStart(e)
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="w-full h-full transition-transform duration-200 ease-out"
              style={{
                transform: map3D 
                  ? `scale(${mapZoom}) translate(${mapPosition.x / mapZoom}px, ${mapPosition.y / mapZoom}px) perspective(1000px) rotateX(15deg) rotateY(-10deg)`
                  : `scale(${mapZoom}) translate(${mapPosition.x / mapZoom}px, ${mapPosition.y / mapZoom}px)`,
                transformOrigin: 'center center',
                transformStyle: 'preserve-3d',
              }}
            >
              <img 
                key={`map-${mapRefreshKey}-${map3D ? '3d' : '2d'}`}
                src={addTimestampToUrl(getMapUrl() || mapImage)}
                alt="Map"
                className="w-full h-full object-contain select-none pointer-events-none"
                style={{
                  filter: map3D ? 'brightness(1.1) contrast(1.1)' : 'none',
                  transition: 'filter 0.3s ease-out',
                }}
                draggable={false}
                onError={() => {
                  setMapError(true)
                }}
                onLoad={() => setMapError(false)}
              />
              
              {/* Интерактивные кликабельные области для комнат на карте */}
              {roomSelectionMode && rooms.length > 0 && (
                <>
                  {rooms.map((room) => {
                    const isSelected = selectedRooms.has(room.id)
                    
                    // Если есть границы комнаты, создаем кликабельную область
                    if (room.bounds) {
                      const width = room.bounds.maxX - room.bounds.minX
                      const height = room.bounds.maxY - room.bounds.minY
                      const left = room.bounds.minX
                      const top = room.bounds.minY
                      
                      return (
                        <div
                          key={room.id}
                          className="absolute z-30 cursor-pointer transition-all"
                          style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            width: `${width}%`,
                            height: `${height}%`,
                            border: isSelected ? '3px solid #10b981' : '2px dashed rgba(59, 130, 246, 0.5)',
                            backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '4px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            const roomEntityId = (room as any).entityId
                            handleRoomClick(room.id, roomEntityId)
                          }}
                          title={room.name}
                        >
                          {/* Центральный маркер комнаты */}
                          {room.x !== undefined && room.y !== undefined && (
                            <div
                              className="absolute"
                              style={{
                                left: `${((room.x - left) / width) * 100}%`,
                                top: `${((room.y - top) / height) * 100}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <div className="relative">
                                {isSelected && (
                                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                                )}
                                <div className={`relative rounded-full p-1.5 shadow-lg ${
                                  isSelected 
                                    ? 'bg-green-600 border-2 border-white' 
                                    : 'bg-blue-500/70 border border-blue-300'
                                }`}>
                                  {isSelected ? (
                                    <CheckCircle2 size={16} className="text-white" />
                                  ) : (
                                    <Box size={16} className="text-white" />
                                  )}
                                </div>
                                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                                  isSelected
                                    ? 'bg-green-600/90 text-white'
                                    : 'bg-blue-600/90 text-white'
                                }`}>
                                  {room.name}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    // Если есть только координаты центра, показываем маркер
                    if (room.x !== undefined && room.y !== undefined) {
                      const roomEntityId = (room as any).entityId
                      return (
                        <div
                          key={room.id}
                          className={`absolute z-30 cursor-pointer transition-all ${
                            isSelected ? 'pointer-events-auto' : 'pointer-events-auto'
                          }`}
                          style={{
                            left: `${room.x}%`,
                            top: `${room.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRoomClick(room.id, roomEntityId)
                          }}
                          title={room.name}
                        >
                          <div className="relative">
                            {isSelected && (
                              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                            )}
                            <div className={`relative rounded-full p-2 shadow-lg transition-all ${
                              isSelected 
                                ? 'bg-green-600 border-2 border-white' 
                                : 'bg-blue-500/70 border border-blue-300 hover:bg-blue-600'
                            }`}>
                              {isSelected ? (
                                <CheckCircle2 size={20} className="text-white" />
                              ) : (
                                <Box size={20} className="text-white" />
                              )}
                            </div>
                            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              isSelected
                                ? 'bg-green-600/90 backdrop-blur-md text-white'
                                : 'bg-blue-600/90 backdrop-blur-md text-white'
                            }`}>
                              {room.name}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    return null
                  })}
                </>
              )}
            </div>
            {/* Overlay с информацией - не блокируем клики в режиме выбора комнат */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 ${
              roomSelectionMode ? 'pointer-events-none' : 'pointer-events-none'
            }`} />
            
            {/* Текущая комната */}
            {currentRoom && (
              <div className="absolute bottom-2 left-2 px-2.5 py-1.5 bg-blue-600/90 backdrop-blur-md rounded-lg text-xs font-medium text-white shadow-lg flex items-center gap-1.5 pointer-events-auto z-20">
                <MapIcon size={12} />
                {currentRoom}
              </div>
            )}
            
            {/* Статус очистки */}
            {isCleaning && (
              <div className="absolute top-2 left-2 px-2.5 py-1.5 bg-green-600/90 backdrop-blur-md rounded-lg text-xs font-medium text-white shadow-lg flex items-center gap-1.5 pointer-events-auto z-20">
                <Zap size={12} className="animate-pulse" />
                מנקה
              </div>
            )}
            
            {/* Индикатор батареи на карте */}
            <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg backdrop-blur-md text-xs font-medium shadow-lg flex items-center gap-1.5 pointer-events-auto z-20 ${
              batteryLevel > 50 ? 'bg-green-600/90 text-white' :
              batteryLevel > 20 ? 'bg-yellow-600/90 text-white' :
              'bg-red-600/90 text-white'
            }`}>
              <Battery size={12} />
              {batteryLevel}%
            </div>
          </div>
        </div>
      )}
      
      {/* Сообщение об ошибке карты или отсутствии карты */}
      {(!mapImage || mapError) && (
        <div className="mb-3 sm:mb-4 rounded-lg border border-dark-border bg-dark-card/50 p-4 flex items-center justify-center min-h-[150px]">
          <div className="text-center">
            <MapIcon size={32} className="mx-auto mb-2 text-dark-textSecondary opacity-50" />
            <div className="text-xs text-dark-textSecondary">
              {mapError ? 'שגיאה בטעינת מפה' : 'מפה לא זמינה'}
            </div>
          </div>
        </div>
      )}

      {/* Основные кнопки управления - все одного размера */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        {!isCleaning && !isPaused && (
          <button
            onClick={() => setShowStartOptions(true)}
            disabled={localLoading || loading || isReturning}
            className="flex-1 min-w-[80px] px-3 sm:px-4 py-2.5 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="התחל ניקוי"
          >
            <Play size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">התחל</span>
          </button>
        )}
        {isCleaning && (
          <button
            onClick={handlePause}
            disabled={localLoading || loading}
            className="flex-1 min-w-[80px] px-3 sm:px-4 py-2.5 sm:py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="השהה"
          >
            <Pause size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">השהה</span>
          </button>
        )}
        {isPaused && (
          <button
            onClick={handleStart}
            disabled={localLoading || loading}
            className="flex-1 min-w-[80px] px-3 sm:px-4 py-2.5 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="המשך"
          >
            <Play size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">המשך</span>
          </button>
        )}
        {(isCleaning || isPaused) && (
          <button
            onClick={handleStop}
            disabled={localLoading || loading}
            className="min-w-[80px] px-3 sm:px-4 py-2.5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="עצור"
          >
            <Square size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">עצור</span>
          </button>
        )}
        {!isDocked && (
          <button
            onClick={handleReturnToBase}
            disabled={localLoading || loading || isReturning}
            className="min-w-[80px] px-3 sm:px-4 py-2.5 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="חזור לבסיס"
          >
            <Home size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">בסיס</span>
          </button>
        )}
        {/* Кнопка меню сервисов */}
        <div className="relative">
          <button
            onClick={() => setShowServicesMenu(!showServicesMenu)}
            disabled={localLoading || loading}
            className="min-w-[80px] px-3 sm:px-4 py-2.5 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            title="תפריט שירותים"
          >
            <Menu size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">שירותים</span>
          </button>
          
          {/* Выпадающее меню сервисов */}
          {showServicesMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowServicesMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-80 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto">
                <div className="p-3 border-b border-dark-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">שירותי Dreame</h3>
                  <button
                    onClick={() => setShowServicesMenu(false)}
                    className="p-1 hover:bg-dark-cardHover rounded transition-colors"
                  >
                    <X size={16} className="text-dark-textSecondary" />
                  </button>
                </div>
                <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
                  {dreameServices.map((service) => {
                    const Icon = service.icon
                    const isActive = currentMode === service.label
                    return (
                      <button
                        key={service.id}
                        onClick={() => handleServiceClick(service)}
                        disabled={localLoading || loading}
                        className={`w-full text-right p-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${
                          isActive
                            ? 'bg-blue-600/30 border-2 border-blue-500'
                            : 'hover:bg-dark-cardHover border border-transparent'
                        }`}
                        title={service.description}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={16} className={`flex-shrink-0 ${
                                isActive ? 'text-blue-400' : 'text-purple-400 group-hover:text-purple-300'
                              }`} />
                              <span className={`text-xs sm:text-sm font-medium ${
                                isActive ? 'text-blue-400' : 'text-white group-hover:text-purple-300'
                              }`}>
                                {service.label}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 bg-blue-500/50 rounded text-[10px] animate-pulse">
                                  פעיל
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-dark-textSecondary line-clamp-1">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Скорость вентилятора */}
      {fanSpeedList.length > 0 && (
        <div className="mb-2 sm:mb-3">
          <div className="text-[10px] sm:text-xs text-dark-textSecondary mb-1.5">מהירות מפוח</div>
          <div className="flex flex-wrap gap-1.5">
            {fanSpeedList.map((speed: string) => (
              <button
                key={speed}
                onClick={() => handleSetFanSpeed(speed)}
                disabled={localLoading || loading}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  fanSpeed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-card hover:bg-dark-cardHover text-dark-textSecondary'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Комнаты - кнопки для быстрого выбора (обычный режим) */}
      {rooms.length > 0 && !roomSelectionMode && (
        <div className="mb-2 sm:mb-3">
          <div className="text-[10px] sm:text-xs text-dark-textSecondary mb-1.5">ניקוי חדרים</div>
          <div className="flex flex-wrap gap-1.5 max-h-24 sm:max-h-32 overflow-y-auto">
            {rooms.slice(0, 8).map((room) => (
              <button
                key={room.id}
                onClick={() => handleCleanRoom(room.id)}
                disabled={localLoading || loading}
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-dark-card hover:bg-dark-cardHover text-dark-textSecondary hover:text-white"
                title={`נקה ${room.name}`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Интерактивный список комнат для выбора на карте */}
      {roomSelectionMode && rooms.length > 0 && (
        <div className="mb-2 sm:mb-3 p-3 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-xl border border-green-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-600/20 rounded-lg">
                <Target size={16} className="text-green-400" />
              </div>
              <span className="text-sm font-semibold text-green-400">בחר חדרים לניקוי</span>
            </div>
            <button
              onClick={() => {
                setRoomSelectionMode(false)
                setSelectedRooms(new Set())
                setCurrentMode('')
              }}
              className="px-3 py-1.5 text-xs bg-dark-bg hover:bg-dark-cardHover text-dark-textSecondary hover:text-white rounded-lg transition-colors border border-dark-border"
            >
              ביטול
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-dark-card/30 rounded-lg border border-green-500/20">
            {rooms.map((room) => {
              const isSelected = selectedRooms.has(room.id)
              return (
                <button
                  key={room.id}
                  onClick={() => handleRoomClick(room.id)}
                  disabled={localLoading || loading}
                  className={`p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed text-right ${
                    isSelected
                      ? 'bg-green-600/30 border-green-500 text-white'
                      : 'bg-dark-bg border-dark-border text-dark-textSecondary hover:border-green-500/50 hover:bg-dark-cardHover'
                  }`}
                  title={isSelected ? 'לחץ לביטול בחירה' : 'לחץ לבחירה'}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Box size={16} className={isSelected ? 'text-green-400' : 'text-dark-textSecondary'} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-dark-textSecondary'}`}>
                        {room.name}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {selectedRooms.size > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-dark-textSecondary">
                נבחרו {selectedRooms.size} מתוך {rooms.length} חדרים
              </span>
              <button
                onClick={handleCleanSelectedRooms}
                disabled={localLoading || loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play size={14} />
                התחל ניקוי {selectedRooms.size} חדרים
              </button>
            </div>
          )}
        </div>
      )}

      {/* Статистика и информация */}
      <div className="mb-2 sm:mb-3 grid grid-cols-2 gap-2">
        {/* Площадь очищена */}
        {(cleanedArea || cleanedAreaSensor) && (
          <div className="bg-dark-card/50 rounded-lg p-2 border border-dark-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Ruler size={12} className="text-blue-400" />
              <span className="text-[10px] text-dark-textSecondary">שטח נקי</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-white">
              {formatArea(cleanedArea || cleanedAreaSensor)}
            </div>
          </div>
        )}
        
        {/* Время очистки */}
        {(cleaningTime || cleaningTimeSensor) && (
          <div className="bg-dark-card/50 rounded-lg p-2 border border-dark-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Timer size={12} className="text-green-400" />
              <span className="text-[10px] text-dark-textSecondary">זמן ניקוי</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-white">
              {formatTime(cleaningTime || cleaningTimeSensor)}
            </div>
          </div>
        )}
        
        {/* Общая площадь */}
        {totalCleanedArea && (
          <div className="bg-dark-card/50 rounded-lg p-2 border border-dark-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity size={12} className="text-purple-400" />
              <span className="text-[10px] text-dark-textSecondary">סה"כ שטח</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-white">
              {formatArea(totalCleanedArea)}
            </div>
          </div>
        )}
        
        {/* Общее время */}
        {totalCleaningTime && (
          <div className="bg-dark-card/50 rounded-lg p-2 border border-dark-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-yellow-400" />
              <span className="text-[10px] text-dark-textSecondary">סה"כ זמן</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-white">
              {formatTime(totalCleaningTime)}
            </div>
          </div>
        )}
      </div>
      
      {/* Ошибки */}
      {error && error !== 'No error' && errorMessage !== 'No error' && (
        <div className="mb-2 sm:mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-red-400">שגיאה</div>
              <div className="text-[10px] text-red-300 truncate">{errorMessage || error}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно настроек уборки с полным функционалом Dreame */}
      {showStartOptions && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowStartOptions(false)}
          >
            <div 
              className="bg-dark-card border border-dark-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-dark-border flex items-center justify-between sticky top-0 bg-dark-card z-10">
                <h3 className="text-lg font-semibold text-white">הגדרות ניקוי מלאות</h3>
                <button
                  onClick={() => setShowStartOptions(false)}
                  className="p-1 hover:bg-dark-cardHover rounded transition-colors"
                >
                  <X size={20} className="text-dark-textSecondary" />
                </button>
              </div>
              <div className="p-4 space-y-6">
                {/* Тип уборки */}
                <div>
                  <label className="block text-sm font-medium text-dark-textSecondary mb-3">
                    סוג ניקוי
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'auto', label: 'אוטומטי', icon: Zap, description: 'ניקוי אוטומטי מלא' },
                      { id: 'vacuum', label: 'שאיבה בלבד', icon: Wind, description: 'רק שאיבת אבק' },
                      { id: 'mop', label: 'שטיפה בלבד', icon: Droplet, description: 'רק שטיפה' },
                      { id: 'vacuum_and_mop', label: 'שאיבה ושטיפה', icon: Activity, description: 'שאיבה ושטיפה יחד' }
                    ].map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedCleaningType(type.id)}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedCleaningType === type.id
                              ? 'border-blue-500 bg-blue-500/20 text-white'
                              : 'border-dark-border bg-dark-bg text-dark-textSecondary hover:border-blue-500/50'
                          }`}
                          title={type.description}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon size={20} />
                            <span className="text-xs font-medium">{type.label}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Количество повторений */}
                <div>
                  <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                    מספר חזרות: {cleaningRepeats}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCleaningRepeats(Math.max(1, cleaningRepeats - 1))}
                      className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-cardHover transition-colors"
                    >
                      <ChevronDown size={16} className="text-white" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={cleaningRepeats}
                      onChange={(e) => setCleaningRepeats(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                      className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-center"
                    />
                    <button
                      onClick={() => setCleaningRepeats(Math.min(5, cleaningRepeats + 1))}
                      className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-cardHover transition-colors"
                    >
                      <ChevronUp size={16} className="text-white" />
                    </button>
                  </div>
                </div>

                {/* Дополнительные опции из документации Dreame */}
                <div className="border-t border-dark-border pt-4">
                  <label className="block text-sm font-medium text-dark-textSecondary mb-3">
                    אפשרויות נוספות
                  </label>
                  <div className="space-y-2">
                    {/* Выбор комнат */}
                    {rooms.length > 0 && (
                      <div>
                        <label className="block text-xs text-dark-textSecondary mb-2">
                          בחר חדרים ספציפיים (אופציונלי)
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-dark-bg rounded-lg border border-dark-border">
                          {rooms.map((room) => {
                            const isSelected = selectedRooms.has(room.id)
                            return (
                              <button
                                key={room.id}
                                onClick={() => handleRoomClick(room.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'bg-green-600 text-white border border-green-500'
                                    : 'bg-dark-card text-dark-textSecondary border border-dark-border hover:border-green-500/50'
                                }`}
                              >
                                {room.name}
                              </button>
                            )
                          })}
                        </div>
                        {selectedRooms.size > 0 && (
                          <p className="text-xs text-green-400 mt-1">
                            נבחרו {selectedRooms.size} חדרים
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопки запуска */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-dark-border">
                  <button
                    onClick={() => {
                      if (selectedRooms.size > 0) {
                        handleCleanSelectedRooms()
                      } else {
                        handleStart(selectedCleaningType, cleaningRepeats)
                      }
                      setShowStartOptions(false)
                    }}
                    disabled={localLoading || loading}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    <Play size={18} />
                    <span>
                      {selectedRooms.size > 0 
                        ? `התחל ניקוי ${selectedRooms.size} חדרים`
                        : 'התחל ניקוי'
                      }
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowStartOptions(false)
                      setSelectedRooms(new Set())
                    }}
                    className="px-4 py-3 bg-dark-bg border border-dark-border hover:bg-dark-cardHover text-white rounded-lg transition-all"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Расширенные настройки */}
      <div className="border-t border-dark-border pt-2 mt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-[10px] sm:text-xs text-dark-textSecondary hover:text-white transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Settings size={12} />
            <span>הגדרות מתקדמות</span>
          </div>
          <ChevronDown 
            size={12} 
            className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {showAdvanced && (
          <div className="mt-2 space-y-3 pt-2 border-t border-dark-border">
            {/* Статистика уборки */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-dark-textSecondary mb-1.5 flex items-center gap-1.5">
                <Activity size={11} />
                סטטיסטיקת ניקוי:
              </div>
              {mappingTime && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary flex items-center gap-1.5">
                    <MapIcon size={10} />
                    זמן מיפוי:
                  </span>
                  <span className="text-white font-medium">{formatTime(mappingTime)}</span>
                </div>
              )}
              {cleaningCount !== undefined && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary flex items-center gap-1.5">
                    <Hash size={10} />
                    מספר ניקויים:
                  </span>
                  <span className="text-white font-medium">{cleaningCount}</span>
                </div>
              )}
              {totalCleaningCount !== undefined && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary flex items-center gap-1.5">
                    <Database size={10} />
                    סה"כ ניקויים:
                  </span>
                  <span className="text-white font-medium">{totalCleaningCount}</span>
                </div>
              )}
              {lastCleaningTime && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary flex items-center gap-1.5">
                    <Calendar size={10} />
                    ניקוי אחרון:
                  </span>
                  <span className="text-white font-medium">{new Date(lastCleaningTime).toLocaleString('he-IL', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              )}
              {mapName && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary flex items-center gap-1.5">
                    <MapIcon size={10} />
                    שם מפה:
                  </span>
                  <span className="text-white font-medium truncate max-w-[60%]">{mapName}</span>
                </div>
              )}
            </div>
            
            {/* Состояние компонентов */}
            {(mainBrushLife !== undefined || sideBrushLife !== undefined || filterLife !== undefined || 
              waterBoxLife !== undefined || mopLife !== undefined || mopPadLife !== undefined || 
              dustCollectionLife !== undefined || sensorDirtyLife !== undefined) && (
              <div className="space-y-1.5 pt-1 border-t border-dark-border/50">
                <div className="text-[10px] text-dark-textSecondary mb-1.5 flex items-center gap-1.5">
                  <Gauge size={11} />
                  מצב רכיבים:
                </div>
                {mainBrushLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">מברשת ראשית:</span>
                    <span className={`font-medium ${
                      mainBrushLife > 50 ? 'text-green-400' :
                      mainBrushLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {mainBrushLife}%
                    </span>
                  </div>
                )}
                {sideBrushLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">מברשת צד:</span>
                    <span className={`font-medium ${
                      sideBrushLife > 50 ? 'text-green-400' :
                      sideBrushLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {sideBrushLife}%
                    </span>
                  </div>
                )}
                {filterLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">מסנן:</span>
                    <span className={`font-medium ${
                      filterLife > 50 ? 'text-green-400' :
                      filterLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {filterLife}%
                    </span>
                  </div>
                )}
                {sensorDirtyLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">חיישן לכלוך:</span>
                    <span className={`font-medium ${
                      sensorDirtyLife > 50 ? 'text-green-400' :
                      sensorDirtyLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {sensorDirtyLife}%
                    </span>
                  </div>
                )}
                {waterBoxLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary flex items-center gap-1">
                      <Droplet size={10} />
                      מיכל מים:
                    </span>
                    <span className={`font-medium ${
                      waterBoxLife > 50 ? 'text-green-400' :
                      waterBoxLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {waterBoxLife}%
                    </span>
                  </div>
                )}
                {mopLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">סמרטוט:</span>
                    <span className={`font-medium ${
                      mopLife > 50 ? 'text-green-400' :
                      mopLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {mopLife}%
                    </span>
                  </div>
                )}
                {mopPadLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">כרית סמרטוט:</span>
                    <span className={`font-medium ${
                      mopPadLife > 50 ? 'text-green-400' :
                      mopPadLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {mopPadLife}%
                    </span>
                  </div>
                )}
                {dustCollectionLife !== undefined && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">מיכל אבק:</span>
                    <span className={`font-medium ${
                      dustCollectionLife > 50 ? 'text-green-400' :
                      dustCollectionLife > 20 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {dustCollectionLife}%
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Настройки и режимы */}
            <div className="space-y-1.5 pt-1 border-t border-dark-border/50">
              <div className="text-[10px] text-dark-textSecondary mb-1.5 flex items-center gap-1.5">
                <Settings size={11} />
                הגדרות:
              </div>
              {fanSpeedLevel !== undefined && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary flex items-center gap-1">
                    <Wind size={10} />
                    רמת מפוח:
                  </span>
                  <span className="text-white font-medium">{fanSpeedLevel}</span>
                </div>
              )}
              {waterLevel !== undefined && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary flex items-center gap-1">
                    <Droplet size={10} />
                    רמת מים:
                  </span>
                  <span className="text-white font-medium">{waterLevel}</span>
                </div>
              )}
              {carpetMode !== undefined && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary">מצב שטיח:</span>
                  <span className="text-white font-medium">{carpetMode ? 'פעיל' : 'כבוי'}</span>
                </div>
              )}
              {obstacleAvoidance !== undefined && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary">הימנעות ממכשולים:</span>
                  <span className="text-white font-medium">{obstacleAvoidance ? 'פעיל' : 'כבוי'}</span>
                </div>
              )}
              {doNotDisturb !== undefined && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary">אל תפריע:</span>
                  <span className={`font-medium ${doNotDisturb ? 'text-yellow-400' : 'text-green-400'}`}>
                    {doNotDisturb ? 'פעיל' : 'כבוי'}
                  </span>
                </div>
              )}
              {voicePack && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-dark-textSecondary">חבילת קול:</span>
                  <span className="text-white font-medium truncate max-w-[60%]">{voicePack}</span>
                </div>
              )}
            </div>
            
            {/* Информация об устройстве */}
            {(firmwareVersion || serialNumber || model) && (
              <div className="space-y-1.5 pt-1 border-t border-dark-border/50">
                <div className="text-[10px] text-dark-textSecondary mb-1.5 flex items-center gap-1.5">
                  <Info size={11} />
                  מידע על המכשיר:
                </div>
                {model && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">מודל:</span>
                    <span className="text-white font-medium">{model}</span>
                  </div>
                )}
                {firmwareVersion && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">גרסת תוכנה:</span>
                    <span className="text-white font-medium">{firmwareVersion}</span>
                  </div>
                )}
                {serialNumber && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-dark-textSecondary">מספר סידורי:</span>
                    <span className="text-white font-medium text-[9px] truncate max-w-[60%]">{serialNumber}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Все атрибуты для отладки */}
            <details className="text-[10px] text-dark-textSecondary pt-1 border-t border-dark-border/50">
              <summary className="cursor-pointer hover:text-white flex items-center gap-1.5">
                <Database size={10} />
                כל האטריבוטים
              </summary>
              <pre className="mt-2 p-2 bg-dark-card rounded text-[8px] overflow-auto max-h-40 border border-dark-border">
                {JSON.stringify(entity?.attributes, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

const VacuumWidget = () => {
  const [vacuumConfigs, setVacuumConfigs] = useState<VacuumConfig[]>([])
  const { api } = useHomeAssistant()
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [mapEntities, setMapEntities] = useState<Map<string, Entity>>(new Map())
  const [relatedEntities, setRelatedEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfig = () => {
      try {
        const config = getVacuumConfigsSync()
        setVacuumConfigs(Array.isArray(config) ? config : [])
      } catch (error) {
        console.error('Ошибка загрузки конфигурации пылесоса:', error)
        setVacuumConfigs([])
      }
    }

    loadConfig()

    const handleWidgetsChanged = () => {
      loadConfig()
    }

    window.addEventListener('widgets-changed', handleWidgetsChanged)
    return () => {
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  useEffect(() => {
    if (api && vacuumConfigs.length > 0) {
      loadEntities()
      const interval = setInterval(loadEntities, 3000)
      return () => clearInterval(interval)
    }
  }, [api, vacuumConfigs])

  const loadEntities = async () => {
    if (!api || vacuumConfigs.length === 0) return

    try {
      const entityIds = vacuumConfigs
        .map(v => v.entityId)
        .filter((id): id is string => id !== null)

      const mapEntityIds = vacuumConfigs
        .flatMap(v => {
          // Используем новый формат mapEntityIds, если есть, иначе старый mapEntityId для обратной совместимости
          if (v.mapEntityIds && v.mapEntityIds.length > 0) {
            return v.mapEntityIds
          }
          return v.mapEntityId ? [v.mapEntityId] : []
        })
        .filter((id): id is string => id !== null && id !== '')

      // Добавляем все связанные entities из конфигурации
      const relatedEntityIds = vacuumConfigs
        .flatMap(v => v.relatedEntities || [])
        .map(re => typeof re === 'string' ? re : re.entityId)
        .filter((id): id is string => id !== null && id !== undefined)

      const allEntityIds = [...new Set([...entityIds, ...mapEntityIds, ...relatedEntityIds])]

      if (allEntityIds.length === 0) return

      const states = await Promise.all(
        allEntityIds.map(id => api.getState(id).catch(() => null))
      )

      const newEntities = new Map<string, Entity>()
      const newMapEntities = new Map<string, Entity>()

      entityIds.forEach((id) => {
        const state = states[allEntityIds.indexOf(id)]
        if (state) {
          newEntities.set(id, state)
        }
      })

      mapEntityIds.forEach((id) => {
        const state = states[allEntityIds.indexOf(id)]
        if (state) {
          newMapEntities.set(id, state)
        }
      })

      // Загружаем также все связанные entities
      const newRelatedEntities = new Map<string, Entity>()
      relatedEntityIds.forEach((id) => {
        const state = states[allEntityIds.indexOf(id)]
        if (state) {
          // Если это map entity, добавляем в mapEntities
          if (id.includes('map') || id.includes('mappin') || 
              id.startsWith('camera.') || id.startsWith('image.')) {
            newMapEntities.set(id, state)
          } else {
            // Остальные связанные entities сохраняем для использования в виджете
            newRelatedEntities.set(id, state)
          }
        }
      })

      setEntities(newEntities)
      setMapEntities(newMapEntities)
      setRelatedEntities(newRelatedEntities)
    } catch (error) {
      console.error('Ошибка загрузки состояний пылесосов:', error)
    }
  }

  if (vacuumConfigs.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">שואב אבק לא מוגדר</div>
          <div className="text-xs text-dark-textSecondary">הגדר בהגדרות ← הגדרת ווידג'טים</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-2 sm:p-3 md:p-4 overflow-y-auto">
      <div className={`grid gap-3 sm:gap-4 ${
        vacuumConfigs.length === 1 
          ? 'grid-cols-1' 
          : vacuumConfigs.length === 2 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {Array.isArray(vacuumConfigs) && vacuumConfigs.map((vacuumConfig, index) => {
          // Используем первую карту из массива mapEntityIds, если есть, иначе mapEntityId для обратной совместимости
          const primaryMapId = vacuumConfig.mapEntityIds && vacuumConfig.mapEntityIds.length > 0
            ? vacuumConfig.mapEntityIds[0]
            : vacuumConfig.mapEntityId
          const primaryMapEntity = primaryMapId ? mapEntities.get(primaryMapId) || null : null
          
          return (
            <VacuumUnit
              key={vacuumConfig.entityId || index}
              vacuumConfig={vacuumConfig}
              entity={vacuumConfig.entityId ? entities.get(vacuumConfig.entityId) || null : null}
              mapEntity={primaryMapEntity}
              relatedEntities={relatedEntities}
              api={api}
              loading={loading}
              onLoadingChange={setLoading}
            />
          )
        })}
      </div>
    </div>
  )
}

export default VacuumWidget

