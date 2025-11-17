import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getCameraConfigsSync, CameraConfig, getCamerasStyleSync, CamerasStyle } from '../../services/widgetConfig'
import { getConnectionConfig } from '../../services/apiService'
import {
  PreparedCamera,
  CamerasListStyle,
  CamerasCardStyle,
  CamerasCompactStyle,
  CamerasGridStyle,
  CamerasListNotConfigured,
  CamerasCardNotConfigured,
  CamerasCompactNotConfigured,
  CamerasGridNotConfigured,
} from './CamerasStyles'

const CamerasWidget = () => {
  const { api } = useHomeAssistant()
  const [cameras, setCameras] = useState<CameraConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [style, setStyle] = useState<CamerasStyle>('grid')
  const [haBaseUrl, setHaBaseUrl] = useState<string>('')

  useEffect(() => {
    const loadConfig = () => {
      const config = getCameraConfigsSync()
      setCameras(config)
      const widgetStyle = getCamerasStyleSync()
      setStyle(widgetStyle)
    }

    loadConfig()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config') {
        loadConfig()
      }
    }

    const handleWidgetsChanged = () => {
      loadConfig()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

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

  useEffect(() => {
    if (cameras.length > 0 && api) {
      loadEntities()
      const interval = setInterval(loadEntities, 5000) // Обновляем каждые 5 секунд для камер
      return () => clearInterval(interval)
    }
  }, [cameras, api])

  const loadEntities = async () => {
    if (!api) return

    try {
      const entityIds = cameras
        .map(c => c.entityId)
        .filter((id): id is string => id !== null)

      if (entityIds.length === 0) return

      const states = await Promise.all(
        entityIds.map(id => api.getState(id).catch(() => null))
      )

      const newEntities = new Map<string, Entity>()
      entityIds.forEach((id, index) => {
        const state = states[index]
        if (state) {
          newEntities.set(id, state)
        }
      })

      setEntities(newEntities)
    } catch (error) {
      console.error('Ошибка загрузки состояний камер:', error)
    }
  }

  const getImageUrl = (camera: CameraConfig): string | null => {
    if (!camera.entityId || !haBaseUrl) return null

    const entity = entities.get(camera.entityId)
    if (!entity) return null

    // Проверяем, что entity это камера
    if (!entity.entity_id.startsWith('camera.') && !entity.entity_id.startsWith('image.')) {
      return null
    }

    // Пробуем получить URL из атрибутов
    const entityPicture = entity.attributes?.entity_picture
    if (entityPicture) {
      // Если URL относительный, делаем его абсолютным
      if (!entityPicture.startsWith('http')) {
        return entityPicture.startsWith('/') 
          ? `${haBaseUrl}${entityPicture}` 
          : `${haBaseUrl}/${entityPicture}`
      }
      return entityPicture
    }

    // Используем camera_proxy для получения изображения
    return `${haBaseUrl}/api/camera_proxy/${entity.entity_id}?t=${Date.now()}`
  }

  const isOnline = (camera: CameraConfig): boolean => {
    if (!camera.entityId) return false
    const entity = entities.get(camera.entityId)
    if (!entity) return false
    return entity.state !== 'unavailable' && entity.state !== 'unknown'
  }

  const getDisplayName = (camera: CameraConfig): string => {
    if (camera.name) return camera.name
    if (camera.entityId) {
      const entity = entities.get(camera.entityId)
      if (entity?.attributes.friendly_name) {
        return entity.attributes.friendly_name
      }
      return camera.entityId.split('.')[1] || camera.entityId
    }
    return 'Неизвестная камера'
  }

  const preparedCameras: PreparedCamera[] = cameras.map((camera, index) => ({
    id: camera.entityId || `camera-${index}`,
    name: getDisplayName(camera),
    imageUrl: getImageUrl(camera),
    hasEntity: camera.entityId !== null,
    isOnline: isOnline(camera),
  }))

  const renderStyle = () => {
    if (preparedCameras.length === 0) {
      switch (style) {
        case 'card':
          return <CamerasCardNotConfigured />
        case 'compact':
          return <CamerasCompactNotConfigured />
        case 'grid':
          return <CamerasGridNotConfigured />
        case 'list':
        default:
          return <CamerasListNotConfigured />
      }
    }

    const props = { cameras: preparedCameras }

    switch (style) {
      case 'card':
        return <CamerasCardStyle {...props} />
      case 'compact':
        return <CamerasCompactStyle {...props} />
      case 'grid':
        return <CamerasGridStyle {...props} />
      case 'list':
      default:
        return <CamerasListStyle {...props} />
    }
  }

  return (
    <div className="h-full p-4 overflow-y-auto">
      {renderStyle()}
    </div>
  )
}

export default CamerasWidget

