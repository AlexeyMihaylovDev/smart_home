import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import { Entity } from '../services/homeAssistantAPI'
import { Search, RefreshCw, Lightbulb, Power, Settings as SettingsIcon, List, Tv, Camera, Gauge, Save, ArrowLeft, Wind, Music, Droplet, Gauge as GaugeIcon, Clock, Navigation, Plus, Sparkles, Activity, User, ChevronDown } from 'lucide-react'
import { getAmbientLightingConfigSync, updateAmbientLightingConfig, getAmbientLightingStyleSync, updateAmbientLightingStyle, LightConfig, AmbientLightingStyle, getACConfigsSync, updateACConfigs, ACConfig, getWaterHeaterConfigSync, updateWaterHeaterConfig, WaterHeaterConfig, getWaterHeaterStyleSync, updateWaterHeaterStyle, WaterHeaterStyle, getSensorsConfigSync, updateSensorsConfig, SensorConfig, getSensorsStyleSync, updateSensorsStyle, SensorsStyle, getMotorConfigsSync, updateMotorConfigs, MotorConfig, getMotorsStyleSync, updateMotorsStyle, MotorsStyle, getSpotifyConfigSync, updateSpotifyConfig, SpotifyConfig, getBoseConfigsSync, updateBoseConfigs, BoseConfig, getVacuumConfigsSync, updateVacuumConfigs, VacuumConfig, getCameraConfigsSync, updateCameraConfigs, CameraConfig, getCamerasStyleSync, updateCamerasStyle, CamerasStyle, getTVPreviewConfigsSync, updateTVPreviewConfigs, TVPreviewConfig, getClockConfigSync, updateClockConfig, ClockConfig, getLEDConfigsSync, updateLEDConfigs, LEDConfig, getLEDStyleSync, updateLEDStyle, LEDStyle, isWidgetEnabledSync, getWidgetConfig } from '../services/widgetConfig'
import { getConnectionConfig, saveConnectionConfig } from '../services/apiService'
import ToggleSwitch from './ui/ToggleSwitch'
import Toast from './ui/Toast'
import SearchableSelect from './ui/SearchableSelect'
import { ListStyle, CardsStyle, CompactStyle, MinimalStyle } from './widgets/AmbientLightingStyles'
import NavigationIconsSettings from './settings/NavigationIconsSettings'
import WidgetSelector, { WidgetType, WidgetOption } from './settings/WidgetSelector'
import ClockWidget from './widgets/ClockWidget'
import {
  TVTimePreview, SpotifyPreview,
  TVPreviewWidget as TVPreviewWidgetPreview, ACPreview, WaterHeaterPreview, SensorsPreview, MotorsPreview, BosePreview, VacuumPreview, CamerasPreview, LEDPreview
} from './settings/WidgetPreviews'

type Tab = 'devices' | 'widgets' | 'navigation' | 'home-assistant'

// Preview компонент для настроек
const PreviewContent = ({ lights, entities, style }: { lights: LightConfig[], entities: Map<string, Entity>, style: AmbientLightingStyle }) => {
  const getEntityState = (entityId: string | null): boolean => {
    if (!entityId) return false
    const entity = entities.get(entityId)
    if (!entity) return false
    return entity.state === 'on'
  }

  const getDisplayName = (light: LightConfig): string => {
    return light.name || 'ללא שם'
  }

  const getIcon = (iconType: 'clock' | 'lightbulb') => {
    return iconType === 'clock' ? Clock : Lightbulb
  }

  const styleProps = {
    lights,
    entities,
    onToggle: () => { }, // Preview не должен переключать
    getEntityState,
    getDisplayName,
    getIcon
  }

  switch (style) {
    case 'cards':
      return <CardsStyle {...styleProps} />
    case 'compact':
      return <CompactStyle {...styleProps} />
    case 'minimal':
      return <MinimalStyle {...styleProps} />
    case 'list':
    default:
      return <ListStyle {...styleProps} />
  }
}


const Settings = () => {
  const { api, connect } = useHomeAssistant()
  const [activeTab, setActiveTab] = useState<Tab>('devices')
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [lightConfigs, setLightConfigs] = useState<LightConfig[]>(() => {
    try {
      return getAmbientLightingConfigSync()
    } catch {
      return []
    }
  })
  const [ambientLightingStyle, setAmbientLightingStyle] = useState<AmbientLightingStyle>(() => {
    try {
      return getAmbientLightingStyleSync()
    } catch {
      return 'list'
    }
  })
  const [acConfigs, setACConfigs] = useState<ACConfig[]>(() => {
    try {
      return getACConfigsSync()
    } catch {
      return []
    }
  })
  const [waterHeaterConfig, setWaterHeaterConfig] = useState<WaterHeaterConfig>(() => {
    try {
      return getWaterHeaterConfigSync()
    } catch {
      return { entityId: null, name: 'דוד מים', style: 'compact' }
    }
  })
  const [waterHeaterStyle, setWaterHeaterStyle] = useState<WaterHeaterStyle>(() => {
    try {
      return getWaterHeaterStyleSync()
    } catch {
      return 'compact'
    }
  })
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>(() => {
    try {
      return getSensorsConfigSync()
    } catch {
      return []
    }
  })
  const [sensorsStyle, setSensorsStyle] = useState<SensorsStyle>(() => {
    try {
      return getSensorsStyleSync()
    } catch {
      return 'list'
    }
  })
  const [showSensorsDemo, setShowSensorsDemo] = useState(false)
  const [motorConfigs, setMotorConfigs] = useState<MotorConfig[]>(() => {
    try {
      return getMotorConfigsSync()
    } catch {
      return []
    }
  })
  const [motorsStyle, setMotorsStyle] = useState<MotorsStyle>(() => {
    try {
      return getMotorsStyleSync()
    } catch {
      return 'list'
    }
  })
  const [showMotorsDemo, setShowMotorsDemo] = useState(false)
  const [spotifyConfig, setSpotifyConfig] = useState<SpotifyConfig>(() => {
    try {
      return getSpotifyConfigSync()
    } catch {
      return {
        accountName: 'Spotify Heta Sanghvi',
        trackName: 'Arms',
        artistName: 'The Paper Kites',
        deviceName: 'Office',
        coverEmoji: '🎵',
        isPlaying: true,
        progress: 45
      }
    }
  })
  const [boseConfigs, setBoseConfigs] = useState<BoseConfig[]>(() => {
    try {
      return getBoseConfigsSync()
    } catch {
      return []
    }
  })
  const [vacuumConfigs, setVacuumConfigs] = useState<VacuumConfig[]>(() => {
    try {
      return getVacuumConfigsSync()
    } catch {
      return []
    }
  })
  const [cameraConfigs, setCameraConfigs] = useState<CameraConfig[]>(() => {
    try {
      return getCameraConfigsSync()
    } catch {
      return []
    }
  })
  const [tvPreviewConfigs, setTVPreviewConfigs] = useState<TVPreviewConfig[]>(() => {
    try {
      return getTVPreviewConfigsSync()
    } catch {
      return []
    }
  })
  const [clockConfig, setClockConfig] = useState<ClockConfig>(() => {
    try {
      return getClockConfigSync()
    } catch {
      return {
        name: 'שעון',
        showSeconds: false,
        showDate: true,
        showDayOfWeek: true,
        format24h: true,
        style: 'digital'
      }
    }
  })
  const [ledConfigs, setLEDConfigs] = useState<LEDConfig[]>(() => {
    try {
      return getLEDConfigsSync()
    } catch {
      return []
    }
  })
  const [ledStyle, setLEDStyle] = useState<LEDStyle>(() => {
    try {
      return getLEDStyleSync()
    } catch {
      return 'list'
    }
  })
  const [showLEDDemo, setShowLEDDemo] = useState(false)
  const [camerasStyle, setCamerasStyle] = useState<CamerasStyle>(() => {
    try {
      return getCamerasStyleSync()
    } catch {
      return 'grid'
    }
  })
  const [showCamerasDemo, setShowCamerasDemo] = useState(false)
  const [haUrl, setHaUrl] = useState('')
  const [haToken, setHaToken] = useState('')
  const [haLoading, setHaLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [widgetEnabledStates, setWidgetEnabledStates] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [previewEntities, setPreviewEntities] = useState<Map<string, Entity>>(new Map())

  const widgetOptions: WidgetOption[] = [
    {
      id: 'ambient-lighting',
      name: 'Ambient Lighting Widget',
      description: 'ניהול מתגי תאורה',
      icon: Lightbulb,
      color: 'bg-yellow-500'
    },
    {
      id: 'tv-time',
      name: 'TV Time Widget',
      description: 'הגדרת זמן פעולת טלוויזיה',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'media-player',
      name: 'Media Player Widget',
      description: 'ניהול נגני מדיה',
      icon: Tv,
      color: 'bg-purple-500'
    },
    {
      id: 'spotify',
      name: 'Spotify Widget',
      description: 'ניהול Spotify',
      icon: Music,
      color: 'bg-green-500'
    },
    {
      id: 'media-room',
      name: 'Media Room Widget',
      description: 'ניהול חדר מדיה',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'canvas',
      name: 'Canvas Widget',
      description: 'ניהול Canvas',
      icon: Tv,
      color: 'bg-purple-500'
    },
    {
      id: 'tv-preview',
      name: 'TV Preview Widget',
      description: 'תצוגה מקדימה של טלוויזיה',
      icon: Tv,
      color: 'bg-orange-500'
    },
    {
      id: 'clock',
      name: 'Clock Widget',
      description: 'שעון דיגיטלי',
      icon: Clock,
      color: 'bg-indigo-500'
    },
    {
      id: 'led',
      name: 'LED Widget',
      description: 'ניהול נורות LED',
      icon: Lightbulb,
      color: 'bg-yellow-500'
    },
    {
      id: 'plex',
      name: 'Plex Widget',
      description: 'ניהול Plex',
      icon: Tv,
      color: 'bg-orange-500'
    },
    {
      id: 'tv-duration',
      name: 'TV Duration Widget',
      description: 'סטטיסטיקת זמן צפייה',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'weather-calendar',
      name: 'Weather Calendar Widget',
      description: 'מזג אוויר ולוח שנה',
      icon: Gauge,
      color: 'bg-cyan-500'
    },
    {
      id: 'living-room',
      name: 'Living Room Widget',
      description: 'ניהול סלון',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'ac',
      name: 'AC Widget',
      description: 'ניהול מזגן',
      icon: Wind,
      color: 'bg-cyan-500'
    },
    {
      id: 'water-heater',
      name: 'Water Heater Widget',
      description: 'ניהול דוד מים גז',
      icon: Droplet,
      color: 'bg-orange-500'
    },
    {
      id: 'sensors',
      name: 'Sensors Widget',
      description: 'ניהול חיישנים',
      icon: Gauge,
      color: 'bg-green-500'
    },
    {
      id: 'motors',
      name: 'Motor Widget',
      description: 'ניהול מכשירים מוטוריים (תריסים, וילונות, שערים)',
      icon: GaugeIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'bose',
      name: 'Bose Widget',
      description: 'ניהול Bose Soundbar',
      icon: Music,
      color: 'bg-purple-500'
    },
    {
      id: 'vacuum',
      name: 'Vacuum Widget',
      description: 'ניהול שואב אבק Dreame',
      icon: Navigation,
      color: 'bg-green-500'
    },
    {
      id: 'cameras',
      name: 'Cameras Widget',
      description: 'ניהול מצלמות',
      icon: Camera,
      color: 'bg-purple-500'
    }
  ]

  // Загружаем конфигурацию с сервера при монтировании компонента
  useEffect(() => {
    const loadConfigFromServer = async () => {
      try {
        console.log('[Settings] Загрузка конфигурации с сервера при монтировании...')
        await getWidgetConfig()
        console.log('[Settings] Конфигурация загружена с сервера, обновляем локальное состояние')
        // После загрузки обновляем локальное состояние
        loadWidgetConfigs()
      } catch (error) {
        console.error('[Settings] Ошибка загрузки конфигурации с сервера:', error)
        // В случае ошибки все равно загружаем из кэша/localStorage
        loadWidgetConfigs()
      }
    }
    loadConfigFromServer()
  }, []) // Загружаем только один раз при монтировании

  useEffect(() => {
    if (activeTab === 'devices') {
      loadEntities()
      setSelectedWidget(null)
    } else {
      // Загружаем конфигурации только если они еще не загружены или если нет несохраненных изменений
      if (!hasUnsavedChanges) {
        loadWidgetConfigs()
      }
      // Загружаем entities для выбора в настройках виджетов
      if (entities.length === 0) {
        loadEntities()
      }
      // Загружаем состояния включенных виджетов
      const states: Record<string, boolean> = {}
      widgetOptions.forEach(widget => {
        if (widget.id) {
          states[widget.id] = isWidgetEnabledSync(widget.id)
        }
      })
      setWidgetEnabledStates(states)
    }
  }, [activeTab])

  useEffect(() => {
    filterEntities()
  }, [entities, searchTerm, filterDomain])

  const loadWidgetConfigs = () => {
    const config = getAmbientLightingConfigSync()
    setLightConfigs(config && Array.isArray(config) ? config : [])
    const acs = getACConfigsSync()
    console.log('Settings: загружены AC конфигурации:', acs)
    setACConfigs(acs && Array.isArray(acs) ? acs : [])
    const wh = getWaterHeaterConfigSync()
    setWaterHeaterConfig(wh)
    const whStyle = getWaterHeaterStyleSync()
    setWaterHeaterStyle(whStyle)
    const sensors = getSensorsConfigSync()
    setSensorConfigs(sensors && Array.isArray(sensors) ? sensors : [])
    const sensorsStyleValue = getSensorsStyleSync()
    setSensorsStyle(sensorsStyleValue)
    const motors = getMotorConfigsSync()
    setMotorConfigs(motors && Array.isArray(motors) ? motors : [])
    const motorsStyleValue = getMotorsStyleSync()
    setMotorsStyle(motorsStyleValue)
    const spotify = getSpotifyConfigSync()
    setSpotifyConfig(spotify)
    const bose = getBoseConfigsSync()
    setBoseConfigs(bose && Array.isArray(bose) ? bose : [])
    const vacuum = getVacuumConfigsSync()
    setVacuumConfigs(vacuum && Array.isArray(vacuum) ? vacuum : [])
    const cameras = getCameraConfigsSync()
    setCameraConfigs(cameras && Array.isArray(cameras) ? cameras : [])
    const camerasStyleValue = getCamerasStyleSync()
    setCamerasStyle(camerasStyleValue)
    const tvs = getTVPreviewConfigsSync()
    setTVPreviewConfigs(tvs && Array.isArray(tvs) ? tvs : [])
    const clock = getClockConfigSync()
    setClockConfig(clock || {
      name: 'שעון',
      showSeconds: false,
      showDate: true,
      showDayOfWeek: true,
      format24h: true,
      style: 'digital'
    })
    const leds = getLEDConfigsSync()
    setLEDConfigs(leds && Array.isArray(leds) ? leds : [])
    const ledStyleValue = getLEDStyleSync()
    setLEDStyle(ledStyleValue)
  }

  useEffect(() => {
    // Загружаем настройки Home Assistant при открытии вкладки
    if (activeTab === 'home-assistant') {
      const loadHAConfig = async () => {
        try {
          const connection = await getConnectionConfig()
          if (connection) {
            setHaUrl(connection.url || '')
            setHaToken(connection.token || '')
          }
        } catch (error) {
          console.error('Ошибка загрузки настроек Home Assistant:', error)
        }
      }
      loadHAConfig()
    }
  }, [activeTab])

  // Загружаем состояния entities для preview виджета
  useEffect(() => {
    if (selectedWidget === 'ambient-lighting' && api && lightConfigs.length > 0) {
      const loadPreviewEntities = async () => {
        try {
          const entityIds = lightConfigs
            .map(l => l.entityId)
            .filter((id): id is string => id !== null)

          if (entityIds.length === 0) {
            setPreviewEntities(new Map())
            return
          }

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

          setPreviewEntities(newEntities)
        } catch (error) {
          console.error('Ошибка загрузки состояний для preview:', error)
        }
      }

      loadPreviewEntities()
      const interval = setInterval(loadPreviewEntities, 2000)
      return () => clearInterval(interval)
    } else {
      setPreviewEntities(new Map())
    }
  }, [selectedWidget, lightConfigs, api])

  const loadEntities = async () => {
    if (!api) return

    setLoading(true)
    try {
      const allEntities = await api.getStates()
      setEntities(allEntities)
    } catch (error) {
      console.error('Ошибка загрузки сущностей:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEntities = () => {
    let filtered = entities

    // Фильтр по домену
    if (filterDomain !== 'all') {
      filtered = filtered.filter(e => e.entity_id.startsWith(`${filterDomain}.`))
    }

    // Поиск по названию или entity_id
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(e =>
        e.entity_id.toLowerCase().includes(term) ||
        (e.attributes.friendly_name || '').toLowerCase().includes(term)
      )
    }

    setFilteredEntities(filtered)
  }

  const getDomain = (entityId: string) => entityId.split('.')[0]
  const getUniqueDomains = () => {
    const domains = new Set(entities.map(e => getDomain(e.entity_id)))
    return Array.from(domains).sort()
  }

  const isSwitchable = (entity: Entity) => {
    const domain = getDomain(entity.entity_id)
    return ['light', 'switch', 'input_boolean', 'fan', 'climate'].includes(domain)
  }

  const getEntityIcon = (entity: Entity) => {
    const domain = getDomain(entity.entity_id)
    if (domain === 'light') return <Lightbulb size={16} className="text-yellow-500" />
    return <Power size={16} className="text-blue-500" />
  }

  const handleLightEntityChange = (index: number, entityId: string | null) => {
    const newConfigs = [...lightConfigs]
    newConfigs[index].entityId = entityId
    setLightConfigs(newConfigs)
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateAmbientLightingConfig(lightConfigs)
      setHasUnsavedChanges(false)
      window.dispatchEvent(new Event('widgets-changed'))
      setToast({ message: 'ההגדרות נשמרו!', type: 'success' })
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
    }
  }

  const autoFillFromSwitches = () => {
    // Получаем все switch устройства
    const switchEntities = entities.filter(e => {
      const domain = e.entity_id.split('.')[0]
      return domain === 'switch'
    })

    if (switchEntities.length === 0) {
      alert('לא נמצאו מכשירי switch ב-Home Assistant')
      return
    }

    // Создаем новую конфигурацию
    const newConfigs: LightConfig[] = []

    // Заполняем существующие слоты и добавляем новые если нужно
    switchEntities.forEach((entity, index) => {
      const friendlyName = entity.attributes.friendly_name || entity.entity_id

      if (index < lightConfigs.length) {
        // Обновляем существующий слот
        newConfigs.push({
          ...lightConfigs[index],
          name: friendlyName,
          entityId: entity.entity_id,
          icon: 'lightbulb'
        })
      } else {
        // Добавляем новый слот
        newConfigs.push({
          name: friendlyName,
          entityId: entity.entity_id,
          icon: 'lightbulb'
        })
      }
    })

    // Если switch меньше чем слотов, оставляем остальные как есть
    if (switchEntities.length < lightConfigs.length) {
      for (let i = switchEntities.length; i < lightConfigs.length; i++) {
        newConfigs.push(lightConfigs[i])
      }
    }

    setLightConfigs(newConfigs)
    setSelectedItems(new Set())
    setHasUnsavedChanges(true)
    alert(`מילא אוטומטית ${switchEntities.length} מתגים ממכשירי switch שנמצאו`)
  }

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === lightConfigs.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(lightConfigs.map((_, index) => index)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) {
      alert('בחר אלמנטים למחיקה')
      return
    }

    if (confirm(`למחוק ${selectedItems.size} אלמנטים נבחרים?`)) {
      const newConfigs = lightConfigs.filter((_, index) => !selectedItems.has(index))
      setLightConfigs(newConfigs)
      setSelectedItems(new Set())
      setHasUnsavedChanges(true)
    }
  }

  const handleDeleteAll = () => {
    if (confirm('למחוק את כל האלמנטים מהווידג\'ט?')) {
      setLightConfigs([])
      setSelectedItems(new Set())
      setHasUnsavedChanges(true)
    }
  }

  const handleAddNew = () => {
    const newConfig: LightConfig = {
      name: 'Новый переключатель',
      entityId: null,
      icon: 'lightbulb'
    }
    const newConfigs = [...lightConfigs, newConfig]
    setLightConfigs(newConfigs)
    setHasUnsavedChanges(true)
  }

  const handleDeleteItem = (index: number) => {
    if (confirm('למחוק את האלמנט הזה?')) {
      const newConfigs = lightConfigs.filter((_, i) => i !== index)
      setLightConfigs(newConfigs)
      const newSelected = new Set(selectedItems)
      newSelected.delete(index)
      setSelectedItems(newSelected)
      setHasUnsavedChanges(true)
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-2 sm:px-4 md:px-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">הגדרות לוח בקרה</h1>
        <p className="text-sm sm:text-base text-dark-textSecondary">
          ניהול קישור וידג'טים למכשירי Home Assistant
        </p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-4 sm:mb-6 border-b border-dark-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'devices'
            ? 'border-blue-500 text-white'
            : 'border-transparent text-dark-textSecondary hover:text-white'
            }`}
        >
          <div className="flex items-center gap-2">
            <List size={18} />
            כל המכשירים
          </div>
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'widgets'
            ? 'border-blue-500 text-white'
            : 'border-transparent text-dark-textSecondary hover:text-white'
            }`}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon size={18} />
            הגדרת וידג'טים
          </div>
        </button>
        <button
          onClick={() => setActiveTab('navigation')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'navigation'
            ? 'border-blue-500 text-white'
            : 'border-transparent text-dark-textSecondary hover:text-white'
            }`}
        >
          <div className="flex items-center gap-2">
            <Navigation size={18} />
            ניווט
          </div>
        </button>
        <button
          onClick={() => setActiveTab('home-assistant')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'home-assistant'
            ? 'border-blue-500 text-white'
            : 'border-transparent text-dark-textSecondary hover:text-white'
            }`}
        >
          <div className="flex items-center gap-2">
            <Power size={18} />
            Home Assistant
          </div>
        </button>
      </div>

      {activeTab === 'home-assistant' ? (
        /* Настройка Home Assistant */
        <div className="bg-dark-card rounded-lg border border-dark-border p-6">
          <h2 className="text-xl font-bold mb-4">הגדרת חיבור ל-Home Assistant</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                כתובת URL של Home Assistant
              </label>
              <input
                type="text"
                value={haUrl}
                onChange={(e) => setHaUrl(e.target.value)}
                placeholder="http://192.168.3.12:8123"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Long-Lived Access Token
              </label>
              <input
                type="password"
                value={haToken}
                onChange={(e) => setHaToken(e.target.value)}
                placeholder="הכנס אסימון גישה"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-dark-textSecondary mt-2">
                צור אסימון בפרופיל Home Assistant
              </p>
            </div>
            <button
              onClick={async () => {
                if (!haUrl || !haToken) {
                  setToast({ message: 'אנא מלא את כל השדות', type: 'error' })
                  return
                }
                setHaLoading(true)
                try {
                  await saveConnectionConfig({ url: haUrl, token: haToken })
                  await connect(haUrl, haToken)
                  setToast({ message: 'הגדרות Home Assistant נשמרו והחיבור הוקם!', type: 'success' })
                } catch (error: any) {
                  console.error('Ошибка сохранения настроек Home Assistant:', error)
                  setToast({ message: error?.message || 'שגיאה בשמירת ההגדרות', type: 'error' })
                } finally {
                  setHaLoading(false)
                }
              }}
              disabled={haLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {haLoading ? 'שומר...' : 'שמור והתחבר'}
            </button>
          </div>
        </div>
      ) : activeTab === 'navigation' ? (
        /* Настройка навигации */
        <NavigationIconsSettings widgetOptions={widgetOptions} />
      ) : activeTab === 'widgets' ? (
        /* Настройка виджетов */
        <div className="space-y-6">
          {!selectedWidget ? (
            /* Выбор виджета */
            <WidgetSelector
              widgetOptions={widgetOptions}
              widgetEnabledStates={widgetEnabledStates}
              onWidgetSelect={setSelectedWidget}
              onWidgetEnabledChange={(widgetId, enabled) => {
                setWidgetEnabledStates(prev => ({
                  ...prev,
                  [widgetId]: enabled
                }))
              }}
            />
          ) : (
            /* Настройки выбранного виджета */
            <>
              {selectedWidget === 'ambient-lighting' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">וידג'ט תאורה סביבתית</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדר את הקישור של המתגים למכשירי Home Assistant
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Выбор стиля виджета */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-dark-textSecondary whitespace-nowrap">סגנון וידג'ט:</label>
                          <select
                            value={ambientLightingStyle}
                            onChange={async (e) => {
                              const newStyle = e.target.value as AmbientLightingStyle
                              setAmbientLightingStyle(newStyle)
                              await updateAmbientLightingStyle(newStyle)
                              setHasUnsavedChanges(true)
                              window.dispatchEvent(new Event('widgets-changed'))
                            }}
                            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="list">רשימה</option>
                            <option value="cards">כרטיסים</option>
                            <option value="compact">קומפקטי</option>
                            <option value="minimal">מינימליסטי</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={autoFillFromSwitches}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            title="מלא אוטומטית את כל המתגים ממכשירי switch"
                          >
                            <RefreshCw size={16} />
                            מילוי אוטומטי מ-Switch
                          </button>
                          <button
                            type="button"
                            onClick={handleAddNew}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            title="הוסף מתג חדש"
                          >
                            +
                          </button>
                          {hasUnsavedChanges && (
                            <button
                              onClick={handleSave}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                              title="שמור שינויים"
                            >
                              <Save size={16} />
                              שמור
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {lightConfigs.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-dark-border">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === lightConfigs.length && lightConfigs.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-dark-border bg-dark-bg text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-dark-textSecondary">
                          בחר הכל ({selectedItems.size} נבחרו)
                        </span>
                        {selectedItems.size > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={handleDeleteSelected}
                              className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              מחק נבחרים ({selectedItems.size})
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteAll}
                              className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white rounded text-sm transition-colors"
                            >
                              מחק הכל
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Контейнер с настройками и preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    {/* Список настроек */}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {lightConfigs && lightConfigs.length > 0 ? lightConfigs.map((light, index) => (
                        <div key={index} className={`p-4 bg-dark-bg rounded-lg border ${selectedItems.has(index) ? 'border-blue-500' : 'border-dark-border'} space-y-3`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(index)}
                              onChange={() => handleToggleSelect(index)}
                              className="w-4 h-4 rounded border-dark-border bg-dark-bg text-blue-600 focus:ring-blue-500 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <input
                                type="text"
                                value={light.name}
                                onChange={(e) => {
                                  const newConfigs = [...lightConfigs]
                                  newConfigs[index].name = e.target.value
                                  setLightConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="שם המתג"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(index)}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0"
                              title="מחק את האלמנט הזה"
                            >
                              ✕
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs text-dark-textSecondary mb-1">
                              מזהה ישות: {light.entityId || 'לא מקושר'}
                            </label>
                            <SearchableSelect
                              value={light.entityId || ''}
                              onChange={(selectedEntityId) => {
                                const entityId = selectedEntityId || null
                                handleLightEntityChange(index, entityId)
                                // Обновляем имя из friendly_name если выбрано устройство
                                if (entityId) {
                                  const entity = entities.find(e => e.entity_id === entityId)
                                  if (entity && entity.attributes.friendly_name) {
                                    let friendlyName = entity.attributes.friendly_name
                                    // Убираем " Switch 1", " Switch 2" и т.д. из названия
                                    friendlyName = friendlyName.replace(/\s+Switch\s+\d+$/i, '')
                                    friendlyName = friendlyName.replace(/\s+switch[_\s]?\d+$/i, '')

                                    const newConfigs = [...lightConfigs]
                                    newConfigs[index].name = friendlyName
                                    setLightConfigs(newConfigs)
                                    setHasUnsavedChanges(true)
                                  }
                                }
                              }}
                              options={[
                                { value: '', label: '-- בחר מכשיר --' },
                                ...entities
                                  .filter(e => {
                                    const domain = e.entity_id.split('.')[0]
                                    return ['light', 'switch', 'input_boolean'].includes(domain)
                                  })
                                  .map(entity => ({
                                    value: entity.entity_id,
                                    label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                  }))
                              ]}
                              placeholder="-- בחר מכשיר --"
                              className="w-full"
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין אלמנטים בווידג'ט</p>
                          <button
                            type="button"
                            onClick={handleAddNew}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            הוסף מתג ראשון
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    {lightConfigs.length > 0 && (
                      <div className="lg:border-l lg:border-dark-border lg:pl-4">
                        <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                        <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                              <Lightbulb size={18} className="text-yellow-400" />
                            </div>
                            <div className="font-medium text-white">תאורה סביבתית</div>
                          </div>
                          <PreviewContent
                            lights={lightConfigs}
                            entities={previewEntities}
                            style={ambientLightingStyle}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedWidget === 'tv-time' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedWidget(null)}
                        className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                        title="חזור לבחירת וידג'ט"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div>
                        <h2 className="font-medium text-lg">TV Time Widget</h2>
                        <p className="text-sm text-dark-textSecondary mt-1">
                          הגדרת וידג'ט זמן פעולת טלוויזיה
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4">
                      <div className="text-center text-dark-textSecondary py-8">
                        הגדרות TV Time Widget (בפיתוח)
                      </div>
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Tv size={18} className="text-blue-400" />
                          </div>
                          <div className="font-medium text-white">TV Time</div>
                        </div>
                        <TVTimePreview />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'sensors' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Sensors Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            Настройка датчиков движения и присутствия
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newSensor: SensorConfig = {
                              name: `חיישן תנועה ${sensorConfigs.filter(s => s.type === 'motion').length + 1}`,
                              entityId: null,
                              type: 'motion',
                              powerType: 'electric',
                              batteryEntityId: null
                            }
                            setSensorConfigs([...sensorConfigs, newSensor])
                            setHasUnsavedChanges(true)
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="הוסף חיישן תנועה"
                        >
                          <Activity size={16} />
                          הוסף תנועה
                        </button>
                        <button
                          onClick={() => {
                            const newSensor: SensorConfig = {
                              name: `חיישן נוכחות ${sensorConfigs.filter(s => s.type === 'presence').length + 1}`,
                              entityId: null,
                              type: 'presence',
                              powerType: 'electric',
                              batteryEntityId: null
                            }
                            setSensorConfigs([...sensorConfigs, newSensor])
                            setHasUnsavedChanges(true)
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="הוסף חיישן נוכחות"
                        >
                          <User size={16} />
                          הוסף נוכחות
                        </button>
                        <button
                          onClick={() => setShowSensorsDemo(prev => !prev)}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border ${showSensorsDemo
                            ? 'bg-purple-600/80 border-purple-500 text-white'
                            : 'bg-dark-bg border-dark-border text-dark-textSecondary hover:text-white'
                            }`}
                          title="Показать демо-интерфейс Sensors"
                        >
                          <Sparkles size={16} />
                          {showSensorsDemo ? 'Demo ON' : 'Demo'}
                        </button>
                        <div className="flex items-center gap-2 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-textSecondary">
                          <label htmlFor="sensors-style-select" className="whitespace-nowrap">עיצוב וידג'ט:</label>
                          <div className="relative">
                            <select
                              id="sensors-style-select"
                              value={sensorsStyle}
                              onChange={async (e) => {
                                const newStyle = e.target.value as SensorsStyle
                                setSensorsStyle(newStyle)
                                await updateSensorsStyle(newStyle)
                                window.dispatchEvent(new Event('widgets-changed'))
                              }}
                              className="appearance-none bg-dark-bg text-white border border-dark-border rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="list">רשימה</option>
                              <option value="card">כרטיסים</option>
                              <option value="compact">קומפקטי</option>
                              <option value="grid">Grid</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-textSecondary pointer-events-none" />
                          </div>
                        </div>
                        {hasUnsavedChanges && (
                          <button
                            onClick={async () => {
                              try {
                                await updateSensorsConfig(sensorConfigs)
                                setHasUnsavedChanges(false)
                                window.dispatchEvent(new Event('widgets-changed'))
                                setToast({ message: 'הגדרות חיישנים נשמרו!', type: 'success' })
                              } catch (error) {
                                console.error('Ошибка сохранения:', error)
                                setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                            title="שמור שינויים"
                          >
                            <Save size={16} />
                            שמור
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {sensorConfigs && sensorConfigs.length > 0 ? sensorConfigs.map((sensor, index) => (
                        <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`p-2 rounded-lg ${sensor.type === 'motion' ? 'bg-blue-500/20' : 'bg-green-500/20'
                                }`}>
                                {sensor.type === 'motion' ? (
                                  <Activity size={16} className="text-blue-400" />
                                ) : (
                                  <User size={16} className="text-green-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-dark-textSecondary mb-1">
                                  Название датчика:
                                </label>
                                <input
                                  type="text"
                                  value={sensor.name}
                                  onChange={(e) => {
                                    const newConfigs = [...sensorConfigs]
                                    newConfigs[index].name = e.target.value
                                    setSensorConfigs(newConfigs)
                                    setHasUnsavedChanges(true)
                                  }}
                                  className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="שם החיישן"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (confirm('למחוק את החיישן הזה?')) {
                                      const newConfigs = sensorConfigs.filter((_, i) => i !== index)
                                      setSensorConfigs(newConfigs)
                                      setHasUnsavedChanges(true)
                                    }
                                  }}
                                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0"
                                  title="מחק את החיישן הזה"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                מזהה ישות של חיישן: {sensor.entityId || 'לא מקושר'}
                              </label>
                              <SearchableSelect
                                value={sensor.entityId || ''}
                                onChange={(selectedEntityId) => {
                                  const entityId = selectedEntityId || null
                                  let friendlyName = sensor.name
                                  if (entityId) {
                                    const entity = entities.find(e => e.entity_id === entityId)
                                    if (entity && entity.attributes.friendly_name) {
                                      friendlyName = entity.attributes.friendly_name
                                    }
                                  }
                                  const newConfigs = [...sensorConfigs]
                                  newConfigs[index] = { ...sensor, entityId, name: friendlyName }
                                  setSensorConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                options={[
                                  { value: '', label: '-- בחר חיישן --' },
                                  ...entities
                                    .filter(e => {
                                      const domain = e.entity_id.split('.')[0]
                                      return domain === 'binary_sensor' || domain === 'sensor'
                                    })
                                    .map(entity => ({
                                      value: entity.entity_id,
                                      label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                    }))
                                ]}
                                placeholder="-- בחר חיישן --"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                סוג אספקת חשמל:
                              </label>
                              <select
                                value={sensor.powerType || 'electric'}
                                onChange={(e) => {
                                  const newConfigs = [...sensorConfigs]
                                  newConfigs[index] = {
                                    ...sensor,
                                    powerType: e.target.value as 'battery' | 'electric',
                                    batteryEntityId: e.target.value === 'electric' ? null : (sensor.batteryEntityId || null)
                                  }
                                  setSensorConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="electric">חשמל</option>
                                <option value="battery">סוללה</option>
                              </select>
                            </div>
                            {sensor.powerType === 'battery' && (
                              <div>
                                <label className="block text-xs text-dark-textSecondary mb-1">
                                  מזהה ישות של סוללה: {sensor.batteryEntityId || 'לא מקושר'}
                                </label>
                                <SearchableSelect
                                  value={sensor.batteryEntityId || ''}
                                  onChange={(selectedEntityId) => {
                                    const entityId = selectedEntityId || null
                                    const newConfigs = [...sensorConfigs]
                                    newConfigs[index] = { ...sensor, batteryEntityId: entityId }
                                    setSensorConfigs(newConfigs)
                                    setHasUnsavedChanges(true)
                                  }}
                                  options={[
                                    { value: '', label: '-- בחר חיישן סוללה --' },
                                    ...entities
                                      .filter(e => {
                                        const domain = e.entity_id.split('.')[0]
                                        const entityId = e.entity_id.toLowerCase()
                                        return (domain === 'sensor' || domain === 'binary_sensor') &&
                                          (entityId.includes('battery') || entityId.includes('battery_level') ||
                                            entityId.includes('battery_percentage') || e.attributes.device_class === 'battery')
                                      })
                                      .map(entity => ({
                                        value: entity.entity_id,
                                        label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                      }))
                                  ]}
                                  placeholder="-- בחר חיישן סוללה --"
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין חיישנים בווידג'ט</p>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                const newSensor: SensorConfig = {
                                  name: 'חיישן תנועה 1',
                                  entityId: null,
                                  type: 'motion',
                                  powerType: 'electric',
                                  batteryEntityId: null
                                }
                                setSensorConfigs([newSensor])
                                setHasUnsavedChanges(true)
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Activity size={16} />
                              הוסף חיישן תנועה
                            </button>
                            <button
                              onClick={() => {
                                const newSensor: SensorConfig = {
                                  name: 'חיישן נוכחות 1',
                                  entityId: null,
                                  type: 'presence',
                                  powerType: 'electric',
                                  batteryEntityId: null
                                }
                                setSensorConfigs([newSensor])
                                setHasUnsavedChanges(true)
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              <User size={16} />
                              הוסף חיישן נוכחות
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4 p-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Gauge size={18} className="text-green-400" />
                          </div>
                          <div className="font-medium text-white">Sensors</div>
                        </div>
                        <SensorsPreview configs={sensorConfigs} demo={showSensorsDemo} style={sensorsStyle} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedWidget === 'spotify' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Spotify Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            Управление Spotify
                          </p>
                        </div>
                      </div>
                      {hasUnsavedChanges && (
                        <button
                          onClick={async () => {
                            try {
                              await updateSpotifyConfig(spotifyConfig)
                              setHasUnsavedChanges(false)
                              window.dispatchEvent(new Event('widgets-changed'))
                              setToast({ message: 'הגדרות Spotify נשמרו!', type: 'success' })
                            } catch (error) {
                              console.error('Ошибка сохранения Spotify:', error)
                              setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                          title="Сохранить изменения"
                        >
                          <Save size={16} />
                          Сохранить
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      <div className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                        <div>
                          <label className="block text-xs text-dark-textSecondary mb-1">Аккаунт Spotify:</label>
                          <input
                            type="text"
                            value={spotifyConfig.accountName}
                            onChange={(e) => {
                              setSpotifyConfig({ ...spotifyConfig, accountName: e.target.value })
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Владелец аккаунта"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-dark-textSecondary mb-1">Трек:</label>
                            <input
                              type="text"
                              value={spotifyConfig.trackName}
                              onChange={(e) => {
                                setSpotifyConfig({ ...spotifyConfig, trackName: e.target.value })
                                setHasUnsavedChanges(true)
                              }}
                              className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Название трека"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-dark-textSecondary mb-1">Исполнитель:</label>
                            <input
                              type="text"
                              value={spotifyConfig.artistName}
                              onChange={(e) => {
                                setSpotifyConfig({ ...spotifyConfig, artistName: e.target.value })
                                setHasUnsavedChanges(true)
                              }}
                              className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Исполнитель"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-dark-textSecondary mb-1">Устройство воспроизведения:</label>
                            <input
                              type="text"
                              value={spotifyConfig.deviceName}
                              onChange={(e) => {
                                setSpotifyConfig({ ...spotifyConfig, deviceName: e.target.value })
                                setHasUnsavedChanges(true)
                              }}
                              className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Например: Office"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-dark-textSecondary mb-1">Иконка обложки (emoji):</label>
                            <input
                              type="text"
                              maxLength={2}
                              value={spotifyConfig.coverEmoji}
                              onChange={(e) => {
                                setSpotifyConfig({ ...spotifyConfig, coverEmoji: e.target.value })
                                setHasUnsavedChanges(true)
                              }}
                              className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="🎵"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-dark-textSecondary">Состояние воспроизведения:</span>
                          <ToggleSwitch
                            checked={spotifyConfig.isPlaying}
                            onChange={(value) => {
                              setSpotifyConfig({ ...spotifyConfig, isPlaying: value })
                              setHasUnsavedChanges(true)
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs text-dark-textSecondary mb-1">
                            <span>Прогресс трека:</span>
                            <span className="text-white font-semibold">{spotifyConfig.progress}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={spotifyConfig.progress}
                            onChange={(e) => {
                              setSpotifyConfig({ ...spotifyConfig, progress: parseInt(e.target.value) })
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full bg-dark-card accent-green-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Music size={18} className="text-green-400" />
                          </div>
                          <div className="font-medium text-white">Spotify</div>
                        </div>
                        <SpotifyPreview config={spotifyConfig} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'motors' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Motor Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            Настройка моторных устройств (шторы, жалюзи, ворота)
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newMotor: MotorConfig = {
                              name: `מנוע ${motorConfigs.length + 1}`,
                              entityId: null
                            }
                            setMotorConfigs([...motorConfigs, newMotor])
                            setHasUnsavedChanges(true)
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="הוסף מכשיר מוטורי חדש"
                        >
                          <GaugeIcon size={16} />
                          הוסף מנוע
                        </button>
                        <button
                          onClick={() => setShowMotorsDemo(prev => !prev)}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border ${showMotorsDemo
                            ? 'bg-purple-600/80 border-purple-500 text-white'
                            : 'bg-dark-bg border-dark-border text-dark-textSecondary hover:text-white'
                            }`}
                          title="Показать демо-интерфейс Motors"
                        >
                          <Sparkles size={16} />
                          {showMotorsDemo ? 'Demo ON' : 'Demo'}
                        </button>
                        <div className="flex items-center gap-2 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-dark-textSecondary">
                          <label htmlFor="motors-style-select" className="whitespace-nowrap">עיצוב וידג'ט:</label>
                          <div className="relative">
                            <select
                              id="motors-style-select"
                              value={motorsStyle}
                              onChange={async (e) => {
                                const newStyle = e.target.value as MotorsStyle
                                setMotorsStyle(newStyle)
                                await updateMotorsStyle(newStyle)
                                window.dispatchEvent(new Event('widgets-changed'))
                              }}
                              className="appearance-none bg-dark-bg text-white border border-dark-border rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="list">רשימה</option>
                              <option value="card">כרטיסים</option>
                              <option value="compact">קומפקטי</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-textSecondary pointer-events-none" />
                          </div>
                        </div>
                        {hasUnsavedChanges && (
                          <button
                            onClick={async () => {
                              try {
                                await updateMotorConfigs(motorConfigs)
                                setHasUnsavedChanges(false)
                                window.dispatchEvent(new Event('widgets-changed'))
                                setToast({ message: 'הגדרות מכשירים מוטוריים נשמרו!', type: 'success' })
                              } catch (error) {
                                console.error('Ошибка сохранения:', error)
                                setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                            title="שמור שינויים"
                          >
                            <Save size={16} />
                            שמור
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {motorConfigs && motorConfigs.length > 0 ? motorConfigs.map((motor, index) => (
                        <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                Название моторного устройства:
                              </label>
                              <input
                                type="text"
                                value={motor.name}
                                onChange={(e) => {
                                  const newConfigs = [...motorConfigs]
                                  newConfigs[index].name = e.target.value
                                  setMotorConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="שם המכשיר המוטורי"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('למחוק את המכשיר המוטורי הזה?')) {
                                  const newConfigs = motorConfigs.filter((_, i) => i !== index)
                                  setMotorConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                              title="מחק את המכשיר המוטורי הזה"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-dark-textSecondary mb-1">
                              מזהה ישות של מכשיר מוטורי: {motor.entityId || 'לא מקושר'}
                            </label>
                            <SearchableSelect
                              value={motor.entityId || ''}
                              onChange={(selectedEntityId) => {
                                const entityId = selectedEntityId || null
                                let friendlyName = motor.name
                                if (entityId) {
                                  const entity = entities.find(e => e.entity_id === entityId)
                                  if (entity && entity.attributes.friendly_name) {
                                    friendlyName = entity.attributes.friendly_name
                                  }
                                }
                                const newConfigs = [...motorConfigs]
                                newConfigs[index] = { entityId, name: friendlyName }
                                setMotorConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }}
                              options={[
                                { value: '', label: '-- בחר מכשיר מוטורי --' },
                                ...entities
                                  .filter(e => {
                                    const domain = e.entity_id.split('.')[0]
                                    return domain === 'cover'
                                  })
                                  .map(entity => ({
                                    value: entity.entity_id,
                                    label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                  }))
                              ]}
                              placeholder="-- בחר מכשיר מוטורי --"
                              className="w-full"
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין מכשירים מוטוריים בווידג'ט</p>
                          <button
                            onClick={() => {
                              const newMotor: MotorConfig = {
                                name: 'מנוע 1',
                                entityId: null
                              }
                              setMotorConfigs([newMotor])
                              setHasUnsavedChanges(true)
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            הוסף מכשיר מוטורי ראשון
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <GaugeIcon size={18} className="text-blue-400" />
                          </div>
                          <div className="font-medium text-white">Motors</div>
                        </div>
                        <MotorsPreview configs={motorConfigs} style={motorsStyle} demo={showMotorsDemo} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'bose' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Bose Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת Bose Soundbar
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newBose: BoseConfig = {
                              name: `Bose ${boseConfigs.length + 1}`,
                              entityId: null
                            }
                            setBoseConfigs([...boseConfigs, newBose])
                            setHasUnsavedChanges(true)
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="הוסף Bose חדש"
                        >
                          <Music size={16} />
                          הוסף Bose
                        </button>
                        {hasUnsavedChanges && (
                          <button
                            onClick={async () => {
                              try {
                                await updateBoseConfigs(boseConfigs)
                                setHasUnsavedChanges(false)
                                window.dispatchEvent(new Event('widgets-changed'))
                                setToast({ message: 'הגדרות Bose נשמרו!', type: 'success' })
                              } catch (error) {
                                console.error('Ошибка сохранения:', error)
                                setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                            title="שמור שינויים"
                          >
                            <Save size={16} />
                            שמור
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {boseConfigs && boseConfigs.length > 0 ? boseConfigs.map((bose, index) => (
                        <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                שם Bose Soundbar:
                              </label>
                              <input
                                type="text"
                                value={bose.name}
                                onChange={(e) => {
                                  const newConfigs = [...boseConfigs]
                                  newConfigs[index].name = e.target.value
                                  setBoseConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="שם Bose Soundbar"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('למחוק את ה-Bose הזה?')) {
                                  const newConfigs = boseConfigs.filter((_, i) => i !== index)
                                  setBoseConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                              title="מחק את ה-Bose הזה"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-dark-textSecondary mb-1">
                              מזהה ישות של Bose: {bose.entityId || 'לא מקושר'}
                            </label>
                            <SearchableSelect
                              value={bose.entityId || ''}
                              onChange={(selectedEntityId) => {
                                const entityId = selectedEntityId || null
                                const newConfigs = [...boseConfigs]
                                newConfigs[index] = { ...bose, entityId }
                                setBoseConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }}
                              options={[
                                { value: '', label: '-- בחר Bose Soundbar --' },
                                ...entities
                                  .filter(e => {
                                    const domain = e.entity_id.split('.')[0]
                                    return domain === 'media_player'
                                  })
                                  .map(entity => ({
                                    value: entity.entity_id,
                                    label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                  }))
                              ]}
                              placeholder="-- בחר Bose Soundbar --"
                              className="w-full"
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין Bose בווידג'ט</p>
                          <button
                            onClick={() => {
                              const newBose: BoseConfig = {
                                name: 'Bose Soundbar 1',
                                entityId: null
                              }
                              setBoseConfigs([newBose])
                              setHasUnsavedChanges(true)
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Music size={16} />
                            הוסף Bose ראשון
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Music size={18} className="text-purple-400" />
                          </div>
                          <div className="font-medium text-white">Bose</div>
                        </div>
                        <BosePreview configs={boseConfigs} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'tv-preview' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">TV Preview Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת וידג'ט טלוויזיה
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newTV: TVPreviewConfig = {
                              name: `טלוויזיה ${tvPreviewConfigs.length + 1}`,
                              entityId: null
                            }
                            setTVPreviewConfigs([...tvPreviewConfigs, newTV])
                            setHasUnsavedChanges(true)
                          }}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="הוסף טלוויזיה חדשה"
                        >
                          <Tv size={16} />
                          הוסף טלוויזיה
                        </button>
                        {hasUnsavedChanges && (
                          <button
                            onClick={async () => {
                              try {
                                await updateTVPreviewConfigs(tvPreviewConfigs)
                                setHasUnsavedChanges(false)
                                window.dispatchEvent(new Event('widgets-changed'))
                                setToast({ message: 'הגדרות טלוויזיות נשמרו!', type: 'success' })
                              } catch (error) {
                                console.error('Ошибка сохранения:', error)
                                setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                            title="שמור שינויים"
                          >
                            <Save size={16} />
                            שמור
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {tvPreviewConfigs && tvPreviewConfigs.length > 0 ? tvPreviewConfigs.map((tv, index) => (
                        <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                שם טלוויזיה:
                              </label>
                              <input
                                type="text"
                                value={tv.name}
                                onChange={(e) => {
                                  const newConfigs = [...tvPreviewConfigs]
                                  newConfigs[index].name = e.target.value
                                  setTVPreviewConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="שם הטלוויזיה"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('למחוק את הטלוויזיה הזו?')) {
                                  const newConfigs = tvPreviewConfigs.filter((_, i) => i !== index)
                                  setTVPreviewConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                              title="מחק את הטלוויזיה הזו"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-dark-textSecondary mb-1">
                              מזהה ישות של טלוויזיה: {tv.entityId || 'לא מקושר'}
                            </label>
                            <SearchableSelect
                              value={tv.entityId || ''}
                              onChange={(selectedEntityId) => {
                                const entityId = selectedEntityId || null
                                let friendlyName = tv.name
                                if (entityId) {
                                  const entity = entities.find(e => e.entity_id === entityId)
                                  if (entity && entity.attributes.friendly_name) {
                                    friendlyName = entity.attributes.friendly_name
                                  }
                                }
                                const newConfigs = [...tvPreviewConfigs]
                                newConfigs[index] = { entityId, name: friendlyName }
                                setTVPreviewConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }}
                              options={[
                                { value: '', label: '-- בחר טלוויזיה --' },
                                ...entities
                                  .filter(e => {
                                    const domain = e.entity_id.split('.')[0]
                                    return domain === 'media_player'
                                  })
                                  .map(entity => ({
                                    value: entity.entity_id,
                                    label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                  }))
                              ]}
                              placeholder="-- בחר טלוויזיה --"
                              className="w-full"
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין טלוויזיות בווידג'ט</p>
                          <button
                            onClick={() => {
                              const newTV: TVPreviewConfig = {
                                name: 'טלוויזיה 1',
                                entityId: null
                              }
                              setTVPreviewConfigs([newTV])
                              setHasUnsavedChanges(true)
                            }}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                          >
                            הוסף טלוויזיה ראשונה
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Tv size={18} className="text-orange-400" />
                          </div>
                          <div className="font-medium text-white">TV Preview</div>
                        </div>
                        <TVPreviewWidgetPreview configs={tvPreviewConfigs} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'clock' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Clock Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת וידג'ט שעון
                          </p>
                        </div>
                      </div>
                      {hasUnsavedChanges && (
                        <button
                          onClick={async () => {
                            try {
                              await updateClockConfig(clockConfig)
                              setHasUnsavedChanges(false)
                              window.dispatchEvent(new Event('widgets-changed'))
                              setToast({ message: 'הגדרות שעון נשמרו!', type: 'success' })
                            } catch (error) {
                              console.error('Ошибка сохранения:', error)
                              setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                          title="שמור שינויים"
                        >
                          <Save size={16} />
                          שמור
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      <div className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-4">
                        <div>
                          <label className="block text-xs text-dark-textSecondary mb-1">
                            שם השעון:
                          </label>
                          <input
                            type="text"
                            value={clockConfig.name}
                            onChange={(e) => {
                              setClockConfig({ ...clockConfig, name: e.target.value })
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="שם השעון"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs text-dark-textSecondary">
                            הצג שניות
                          </label>
                          <ToggleSwitch
                            checked={clockConfig.showSeconds || false}
                            onChange={(checked) => {
                              setClockConfig({ ...clockConfig, showSeconds: checked })
                              setHasUnsavedChanges(true)
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs text-dark-textSecondary">
                            הצג תאריך
                          </label>
                          <ToggleSwitch
                            checked={clockConfig.showDate !== false}
                            onChange={(checked) => {
                              setClockConfig({ ...clockConfig, showDate: checked })
                              setHasUnsavedChanges(true)
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs text-dark-textSecondary">
                            הצג יום בשבוע
                          </label>
                          <ToggleSwitch
                            checked={clockConfig.showDayOfWeek !== false}
                            onChange={(checked) => {
                              setClockConfig({ ...clockConfig, showDayOfWeek: checked })
                              setHasUnsavedChanges(true)
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs text-dark-textSecondary">
                            פורמט 24 שעות
                          </label>
                          <ToggleSwitch
                            checked={clockConfig.format24h !== false}
                            onChange={(checked) => {
                              setClockConfig({ ...clockConfig, format24h: checked })
                              setHasUnsavedChanges(true)
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-dark-textSecondary mb-1">
                            סגנון:
                          </label>
                          <select
                            value={clockConfig.style || 'digital'}
                            onChange={(e) => {
                              setClockConfig({ ...clockConfig, style: e.target.value as 'digital' | 'analog' | 'minimal' })
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="digital">דיגיטלי</option>
                            <option value="analog">אנלוגי</option>
                            <option value="minimal">מינימלי</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-dark-textSecondary mb-1">
                            אזור זמן (אופציונלי):
                          </label>
                          <input
                            type="text"
                            value={clockConfig.timezone || ''}
                            onChange={(e) => {
                              setClockConfig({ ...clockConfig, timezone: e.target.value || undefined })
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="לדוגמה: Europe/Moscow, America/New_York"
                          />
                          <p className="text-xs text-dark-textSecondary mt-1">
                            השאר ריק לשימוש בזמן המקומי
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Clock size={18} className="text-indigo-400" />
                          </div>
                          <div className="font-medium text-white">Clock</div>
                        </div>
                        <div className="h-64">
                          <ClockWidget />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'led' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">LED Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת נורות LED
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Выбор стиля виджета */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-dark-textSecondary whitespace-nowrap">סגנון וידג'ט:</label>
                          <select
                            value={ledStyle}
                            onChange={async (e) => {
                              const newStyle = e.target.value as LEDStyle
                              setLEDStyle(newStyle)
                              await updateLEDStyle(newStyle)
                              setHasUnsavedChanges(true)
                              window.dispatchEvent(new Event('widgets-changed'))
                            }}
                            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="list">רשימה</option>
                            <option value="card">כרטיסים</option>
                            <option value="compact">קומפקטי</option>
                            <option value="modern">מודרני</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newLED: LEDConfig = {
                                name: `LED ${ledConfigs.length + 1}`,
                                entityId: null,
                                type: 'dimmer'
                              }
                              setLEDConfigs([...ledConfigs, newLED])
                              setHasUnsavedChanges(true)
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            title="הוסף LED חדש"
                          >
                            <Plus size={16} />
                            הוסף LED
                          </button>
                          {hasUnsavedChanges && (
                            <button
                              onClick={async () => {
                                try {
                                  await updateLEDConfigs(ledConfigs)
                                  setHasUnsavedChanges(false)
                                  window.dispatchEvent(new Event('widgets-changed'))
                                  setToast({ message: 'הגדרות LED נשמרו!', type: 'success' })
                                } catch (error) {
                                  console.error('Ошибка сохранения:', error)
                                  setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                                }
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                              title="שמור שינויים"
                            >
                              <Save size={16} />
                              שמור
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {ledConfigs.length === 0 ? (
                        <div className="text-center py-8 text-dark-textSecondary">
                          <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
                          <p>אין נורות LED מוגדרות</p>
                          <p className="text-xs mt-2">לחץ על "הוסף LED" כדי להוסיף נורה חדשה</p>
                        </div>
                      ) : (
                        ledConfigs.map((led, index) => (
                          <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                            <div>
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                שם הנורה:
                              </label>
                              <input
                                type="text"
                                value={led.name}
                                onChange={(e) => {
                                  const newConfigs = [...ledConfigs]
                                  newConfigs[index].name = e.target.value
                                  setLEDConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="שם הנורה"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                Entity ID:
                              </label>
                              <SearchableSelect
                                value={led.entityId || ''}
                                onChange={(value) => {
                                  const newConfigs = [...ledConfigs]
                                  newConfigs[index].entityId = value || null
                                  setLEDConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                options={filteredEntities
                                  .filter(e => e.entity_id.startsWith('light.'))
                                  .map(e => ({
                                    value: e.entity_id,
                                    label: e.attributes.friendly_name || e.entity_id
                                  }))}
                                placeholder="בחר Entity ID"
                                searchPlaceholder="חפש Entity..."
                                disabled={haLoading}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                סוג נורה:
                              </label>
                              <select
                                value={led.type}
                                onChange={(e) => {
                                  const newConfigs = [...ledConfigs]
                                  newConfigs[index].type = e.target.value as 'rgb' | 'dimmer'
                                  setLEDConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="dimmer">Dimmer (בהירות בלבד)</option>
                                <option value="rgb">RGB (בהירות + צבע)</option>
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                const newConfigs = ledConfigs.filter((_, i) => i !== index)
                                setLEDConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }}
                              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              מחק
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-dark-textSecondary">תצוגה מקדימה של הווידג'ט:</h3>
                        <button
                          onClick={() => setShowLEDDemo(!showLEDDemo)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                          title={showLEDDemo ? 'הסתר דמו' : 'הצג דמו'}
                        >
                          <Sparkles size={14} />
                          {showLEDDemo ? 'הסתר דמו' : 'הצג דמו'}
                        </button>
                      </div>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <LEDPreview
                          configs={ledConfigs}
                          style={ledStyle}
                          demo={showLEDDemo}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'vacuum' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Vacuum Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת שואב אבק Dreame
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            const newVacuum: VacuumConfig = {
                              name: `שואב אבק ${vacuumConfigs.length + 1}`,
                              entityId: null,
                              mapEntityId: null,
                              mapEntityIds: [],
                              relatedEntities: []
                            }
                            setVacuumConfigs([...vacuumConfigs, newVacuum])
                            setHasUnsavedChanges(true)
                            setToast({
                              message: `נוסף שואב אבק ${vacuumConfigs.length + 1}. ניתן להוסיף עוד שואבי אבק ללא הגבלה.`,
                              type: 'success'
                            })
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl"
                          title="הוסף שואב אבק חדש (ללא הגבלה)"
                        >
                          <Navigation size={16} />
                          הוסף שואב אבק ({vacuumConfigs.length} נוספו)
                        </button>
                        {hasUnsavedChanges && (
                          <button
                            onClick={async () => {
                              try {
                                await updateVacuumConfigs(vacuumConfigs)
                                setHasUnsavedChanges(false)
                                window.dispatchEvent(new Event('widgets-changed'))
                                setToast({ message: 'הגדרות שואב אבק נשמרו!', type: 'success' })
                              } catch (error) {
                                console.error('Ошибка сохранения:', error)
                                setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                            title="שמור שינויים"
                          >
                            <Save size={16} />
                            שמור
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {vacuumConfigs && vacuumConfigs.length > 0 ? vacuumConfigs.map((vacuum, index) => (
                        <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                שם שואב אבק:
                              </label>
                              <input
                                type="text"
                                value={vacuum.name}
                                onChange={(e) => {
                                  const newConfigs = [...vacuumConfigs]
                                  newConfigs[index].name = e.target.value
                                  setVacuumConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="שם שואב אבק"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('למחוק את שואב האבק הזה?')) {
                                  const newConfigs = vacuumConfigs.filter((_, i) => i !== index)
                                  setVacuumConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                              title="מחק את שואב האבק הזה"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-dark-textSecondary mb-1">
                              מזהה ישות של שואב אבק: {vacuum.entityId || 'לא מקושר'}
                            </label>
                            <SearchableSelect
                              value={vacuum.entityId || ''}
                              onChange={async (selectedEntityId) => {
                                const entityId = selectedEntityId || null
                                const newConfigs = [...vacuumConfigs]
                                let updatedVacuum = { ...vacuum, entityId, mapEntityId: null }

                                // Автоматически ищем ВСЕ связанные entities
                                if (entityId && api) {
                                  try {
                                    setHaLoading(true)

                                    // Извлекаем базовое имя из entity_id (например, из vacuum.x50_ultra_complete получаем x50_ultra_complete)
                                    const baseName = entityId.split('.').slice(1).join('.')
                                    const baseNameLower = baseName.toLowerCase()

                                    // Ищем все связанные entities
                                    const allEntities = await api.getStates()

                                    // Ищем ВСЕ связанные entities для пылесоса
                                    const baseParts = baseNameLower.split('_').filter(p => p.length > 2)

                                    // Находим все связанные entities (исключая сам vacuum entity)
                                    const relatedEntities = allEntities.filter((e: Entity) => {
                                      if (e.entity_id === entityId) return false // Исключаем сам vacuum entity

                                      // const _eId = e.entity_id.toLowerCase()
                                      const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()

                                      // Точное совпадение базового имени
                                      if (eBase.includes(baseNameLower)) {
                                        return true
                                      }

                                      // Частичное совпадение - проверяем общие части
                                      const eParts = eBase.split('_')
                                      const hasCommonParts = baseParts.some(bp =>
                                        eParts.some(ep => ep.includes(bp) || bp.includes(ep))
                                      )

                                      return hasCommonParts
                                    })

                                    // Ищем map entity среди связанных (приоритет: map/mappin)
                                    let mapEntity = relatedEntities.find((e: Entity) => {
                                      const eId = e.entity_id.toLowerCase()
                                      const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()

                                      // Приоритет 1: Точное совпадение с map/mappin
                                      if (eBase === baseNameLower + '_map' ||
                                        eBase === baseNameLower + '_mappin' ||
                                        eBase === 'map_' + baseNameLower) {
                                        return true
                                      }

                                      // Приоритет 2: Содержит map/mappin в названии
                                      if (eId.includes('map') || eId.includes('mappin')) {
                                        return true
                                      }

                                      // Приоритет 3: Camera/Image с картой
                                      if ((e.entity_id.startsWith('camera.') || e.entity_id.startsWith('image.')) &&
                                        (e.attributes.entity_picture || e.attributes.map_image)) {
                                        return true
                                      }

                                      // Приоритет 4: Sensor с map
                                      if (e.entity_id.startsWith('sensor.') && (eId.includes('map') || eId.includes('mappin'))) {
                                        return true
                                      }

                                      return false
                                    })

                                    if (mapEntity) {
                                      // Сохраняем найденную карту в массив mapEntityIds
                                      const currentMapIds = updatedVacuum.mapEntityIds || (updatedVacuum.mapEntityId ? [updatedVacuum.mapEntityId] : [])
                                      if (!currentMapIds.includes(mapEntity.entity_id)) {
                                        updatedVacuum.mapEntityIds = [...currentMapIds, mapEntity.entity_id]
                                      }
                                      // @ts-ignore
                                      updatedVacuum.mapEntityId = mapEntity.entity_id // Для обратной совместимости
                                    }

                                    // Формируем список всех найденных связанных entities
                                    const foundEntities = relatedEntities
                                      .filter(e => e.entity_id !== mapEntity?.entity_id)
                                      .map(e => ({
                                        id: e.entity_id,
                                        name: e.attributes.friendly_name || e.entity_id.split('.').slice(1).join('.'),
                                        domain: e.entity_id.split('.')[0]
                                      }))

                                    const foundCount = relatedEntities.length

                                    if (foundCount > 0) {
                                      const mapInfo = mapEntity ? `מפה: ${mapEntity.entity_id.split('.').slice(1).join('.')}` : 'מפה לא נמצאה'
                                      const otherInfo = foundEntities.length > 0
                                        ? `. אחרות (${foundEntities.length}): ${foundEntities.slice(0, 3).map(e => e.name).join(', ')}${foundEntities.length > 3 ? '...' : ''}`
                                        : ''

                                      setToast({
                                        message: `נמצאו ${foundCount} ישויות קשורות. ${mapInfo}${otherInfo}`,
                                        type: 'success'
                                      })
                                    } else {
                                      setToast({
                                        message: 'לא נמצאו ישויות קשורות',
                                        type: 'info'
                                      })
                                    }
                                  } catch (error) {
                                    console.error('Ошибка поиска связанных entities:', error)
                                    setToast({
                                      message: 'שגיאה בחיפוש ישויות קשורות',
                                      type: 'error'
                                    })
                                  } finally {
                                    setHaLoading(false)
                                  }
                                }

                                newConfigs[index] = updatedVacuum
                                setVacuumConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }}
                              options={[
                                { value: '', label: '-- בחר שואב אבק --' },
                                ...entities
                                  .filter(e => {
                                    const domain = e.entity_id.split('.')[0]
                                    return domain === 'vacuum'
                                  })
                                  .map(entity => ({
                                    value: entity.entity_id,
                                    label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                  }))
                              ]}
                              placeholder="-- בחר שואב אבק --"
                              className="w-full"
                            />
                            {vacuum.entityId && (
                              <button
                                onClick={async () => {
                                  if (!api || !vacuum.entityId) return

                                  try {
                                    setHaLoading(true)

                                    // Извлекаем базовое имя
                                    const baseName = vacuum.entityId.split('.').slice(1).join('.')
                                    const baseNameLower = baseName.toLowerCase()

                                    // Ищем все связанные entities
                                    const allEntities = await api.getStates()

                                    // Ищем map entity - пробуем разные варианты с приоритетами
                                    // Приоритет 1: Точное совпадение
                                    let mapEntity = allEntities.find((e: Entity) => {
                                      const eId = e.entity_id.toLowerCase()
                                      const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()

                                      return eBase === baseNameLower + '_map' ||
                                        eBase === baseNameLower + '_mappin' ||
                                        eBase === 'map_' + baseNameLower ||
                                        (eBase.includes(baseNameLower) && (eId.includes('map') || eId.includes('mappin')))
                                    })

                                    // Приоритет 2: Частичное совпадение
                                    if (!mapEntity) {
                                      mapEntity = allEntities.find((e: Entity) => {
                                        const eId = e.entity_id.toLowerCase()
                                        const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()

                                        const baseParts = baseNameLower.split('_').filter(p => p.length > 2)
                                        const eParts = eBase.split('_')

                                        const hasCommonParts = baseParts.some(bp =>
                                          eParts.some(ep => ep.includes(bp) || bp.includes(ep))
                                        )

                                        return hasCommonParts && (
                                          eId.includes('map') ||
                                          eId.includes('mappin') ||
                                          (e.entity_id.startsWith('camera.') && (e.attributes.entity_picture || e.attributes.map_image)) ||
                                          (e.entity_id.startsWith('image.') && (e.attributes.entity_picture || e.attributes.map_image)) ||
                                          (e.entity_id.startsWith('sensor.') && (eId.includes('map') || eId.includes('mappin')))
                                        )
                                      })
                                    }

                                    // Приоритет 3: Camera/Image
                                    if (!mapEntity) {
                                      mapEntity = allEntities.find((e: Entity) => {
                                        const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()
                                        return eBase.includes(baseNameLower) && (
                                          (e.entity_id.startsWith('camera.') && (e.attributes.entity_picture || e.attributes.map_image)) ||
                                          (e.entity_id.startsWith('image.') && (e.attributes.entity_picture || e.attributes.map_image))
                                        )
                                      })
                                    }

                                    const newConfigs = [...vacuumConfigs]
                                    let foundAny = false

                                    // Находим ВСЕ связанные entities с более строгим фильтром
                                    const baseParts = baseNameLower.split('_').filter(p => p.length > 2)

                                    const relatedEntities = allEntities.filter((e: Entity) => {
                                      if (e.entity_id === vacuum.entityId) return false

                                      // const _eId = e.entity_id.toLowerCase()
                                      const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()

                                      // Исключаем явно не связанные entities
                                      if (eBase.includes('google_') ||
                                        eBase.includes('translate_') ||
                                        eBase.includes('weather_') ||
                                        eBase.includes('sun_') ||
                                        eBase.includes('zone_') ||
                                        eBase.includes('person_') ||
                                        eBase.includes('device_tracker_') ||
                                        eBase.includes('calendar_')) {
                                        return false
                                      }

                                      // Точное совпадение - entity начинается с базового имени
                                      if (eBase.startsWith(baseNameLower + '_') || eBase === baseNameLower) {
                                        return true
                                      }

                                      // Обратное совпадение - базовое имя содержит части entity
                                      const eParts = eBase.split('_').filter(p => p.length > 2)
                                      const hasSignificantCommonParts = baseParts.filter(bp =>
                                        eParts.some(ep => ep === bp || ep.includes(bp) || bp.includes(ep))
                                      )

                                      // Требуем минимум 2 общие значимые части для частичного совпадения
                                      if (hasSignificantCommonParts.length >= 2) {
                                        return true
                                      }

                                      // Для коротких имен (x50, ultra, complete) требуем точное совпадение
                                      if (baseParts.length <= 3) {
                                        return eBase.startsWith(baseNameLower + '_')
                                      }

                                      return false
                                    })

                                    // Ищем map entity среди связанных
                                    const foundMapEntity = relatedEntities.find((e: Entity) => {
                                      const eId = e.entity_id.toLowerCase()
                                      const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()

                                      if (eBase === baseNameLower + '_map' ||
                                        eBase === baseNameLower + '_mappin' ||
                                        eBase === 'map_' + baseNameLower) {
                                        return true
                                      }

                                      if (eId.includes('map') || eId.includes('mappin')) {
                                        return true
                                      }

                                      if ((e.entity_id.startsWith('camera.') || e.entity_id.startsWith('image.')) &&
                                        (e.attributes.entity_picture || e.attributes.map_image)) {
                                        return true
                                      }

                                      if (e.entity_id.startsWith('sensor.') && (eId.includes('map') || eId.includes('mappin'))) {
                                        return true
                                      }

                                      return false
                                    })

                                    // Определяем тип каждого найденного entity
                                    const relatedEntitiesWithTypes = relatedEntities.map(e => {
                                      const eId = e.entity_id.toLowerCase()
                                      let type: 'map' | 'sensor' | 'camera' | 'image' | 'other' = 'other'

                                      if (e.entity_id.startsWith('sensor.')) {
                                        if (eId.includes('map') || eId.includes('mappin')) {
                                          type = 'map'
                                        } else {
                                          type = 'sensor'
                                        }
                                      } else if (e.entity_id.startsWith('camera.')) {
                                        type = 'camera'
                                      } else if (e.entity_id.startsWith('image.')) {
                                        type = 'image'
                                      } else if (eId.includes('map') || eId.includes('mappin')) {
                                        type = 'map'
                                      }

                                      return {
                                        entityId: e.entity_id,
                                        type,
                                        name: e.attributes.friendly_name || e.entity_id.split('.').slice(1).join('.')
                                      }
                                    })

                                    // Обновляем конфигурацию со всеми найденными entities
                                    newConfigs[index] = {
                                      ...vacuum,
                                      mapEntityId: foundMapEntity?.entity_id || vacuum.mapEntityId,
                                      relatedEntities: relatedEntitiesWithTypes
                                    }

                                    foundAny = relatedEntities.length > 0

                                    if (foundAny) {
                                      const mapInfo = foundMapEntity ? `מפה: ${foundMapEntity.entity_id.split('.').slice(1).join('.')}` : 'מפה לא נמצאה'
                                      const otherEntities = relatedEntities
                                        .filter(e => e.entity_id !== foundMapEntity?.entity_id)
                                        .map(e => e.entity_id.split('.').slice(1).join('.'))

                                      const otherInfo = otherEntities.length > 0
                                        ? `. נמצאו ${otherEntities.length} ישויות נוספות: ${otherEntities.slice(0, 5).join(', ')}${otherEntities.length > 5 ? '...' : ''}`
                                        : ''

                                      setToast({
                                        message: `נמצאו ${relatedEntities.length} ישויות קשורות. ${mapInfo}${otherInfo}`,
                                        type: 'success'
                                      })

                                      setVacuumConfigs(newConfigs)
                                      setHasUnsavedChanges(true)
                                    } else {
                                      setToast({
                                        message: 'לא נמצאו ישויות קשורות',
                                        type: 'info'
                                      })
                                    }
                                  } catch (error) {
                                    console.error('Ошибка поиска связанных entities:', error)
                                    setToast({
                                      message: 'שגיאה בחיפוש ישויות קשורות',
                                      type: 'error'
                                    })
                                  } finally {
                                    setHaLoading(false)
                                  }
                                }}
                                disabled={haLoading}
                                className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title="חפש אוטומטית ישויות קשורות (מפה וכו')"
                              >
                                <RefreshCw size={12} className={haLoading ? 'animate-spin' : ''} />
                                {haLoading ? 'מחפש...' : 'חפש אוטומטית ישויות קשורות'}
                              </button>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs text-dark-textSecondary">
                                  מפות (אופציונלי): {(() => {
                                    const mapIds = vacuum.mapEntityIds || (vacuum.mapEntityId ? [vacuum.mapEntityId] : [])
                                    return mapIds.length > 0 ? `${mapIds.length} נוספו` : 'לא מוגדר'
                                  })()}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newConfigs = [...vacuumConfigs]
                                    const currentMapIds = vacuum.mapEntityIds || (vacuum.mapEntityId ? [vacuum.mapEntityId] : [])
                                    newConfigs[index] = {
                                      ...vacuum,
                                      mapEntityIds: [...currentMapIds, ''],
                                      mapEntityId: vacuum.mapEntityId // Сохраняем для обратной совместимости
                                    }
                                    setVacuumConfigs(newConfigs)
                                    setHasUnsavedChanges(true)
                                  }}
                                  className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center text-xs font-medium shadow-sm"
                                  title="הוסף מפה חדשה"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(() => {
                                  const mapIds = vacuum.mapEntityIds || (vacuum.mapEntityId ? [vacuum.mapEntityId] : [])
                                  if (mapIds.length === 0) {
                                    return (
                                      <p className="text-[10px] text-dark-textSecondary italic">
                                        לחץ על + כדי להוסיף מפה
                                      </p>
                                    )
                                  }
                                  return mapIds.map((mapId, mapIndex) => (
                                    <div key={mapIndex} className="flex items-start gap-2">
                                      <div className="flex-1">
                                        <SearchableSelect
                                          value={mapId || ''}
                                          onChange={(selectedEntityId) => {
                                            const newConfigs = [...vacuumConfigs]
                                            const currentMapIds = vacuum.mapEntityIds || (vacuum.mapEntityId ? [vacuum.mapEntityId] : [])
                                            const updatedMapIds = [...currentMapIds]
                                            updatedMapIds[mapIndex] = selectedEntityId || ''
                                            newConfigs[index] = {
                                              ...vacuum,
                                              mapEntityIds: updatedMapIds.filter(id => id !== ''),
                                              mapEntityId: updatedMapIds[0] || vacuum.mapEntityId // Первая карта для обратной совместимости
                                            }
                                            setVacuumConfigs(newConfigs)
                                            setHasUnsavedChanges(true)
                                          }}
                                          options={[
                                            { value: '', label: '-- בחר ישות מפה (אופציונלי) --' },
                                            ...entities
                                              .filter(e => {
                                                if (!vacuum.entityId) return false
                                                const baseName = vacuum.entityId.split('.').slice(1).join('.').toLowerCase()
                                                const eBase = e.entity_id.split('.').slice(1).join('.').toLowerCase()

                                                // Исключаем явно не связанные entities
                                                if (eBase.includes('google_') ||
                                                  eBase.includes('translate_') ||
                                                  eBase.includes('weather_') ||
                                                  eBase.includes('sun_') ||
                                                  eBase.includes('zone_') ||
                                                  eBase.includes('person_') ||
                                                  eBase.includes('device_tracker_') ||
                                                  eBase.includes('calendar_')) {
                                                  return false
                                                }

                                                // Показываем ВСЕ связанные entities (начинаются с базового имени или содержат его части)
                                                const baseParts = baseName.split('_').filter(p => p.length > 2)

                                                // Точное совпадение - entity начинается с базового имени
                                                if (eBase.startsWith(baseName + '_') || eBase === baseName) {
                                                  return true
                                                }

                                                // Обратное совпадение - базовое имя содержит части entity
                                                const basePartsLower = baseName.split('_')
                                                const ePartsLower = eBase.split('_')

                                                // Проверяем, есть ли общие значимые части
                                                const commonPartsCount = basePartsLower.filter(bp =>
                                                  bp.length > 2 && ePartsLower.some(ep =>
                                                    ep.toLowerCase() === bp.toLowerCase() ||
                                                    ep.toLowerCase().includes(bp.toLowerCase()) ||
                                                    bp.toLowerCase().includes(ep.toLowerCase())
                                                  )
                                                ).length

                                                // Для коротких имен (x50, ultra, complete) требуем минимум 2 общие части
                                                if (baseParts.length <= 3) {
                                                  return commonPartsCount >= 2
                                                }

                                                // Для длинных имен требуем минимум 2 общие части
                                                return commonPartsCount >= 2
                                              })
                                              .sort((a, b) => {
                                                // Связанные entities показываем первыми
                                                if (!vacuum.entityId) return 0
                                                const baseName = vacuum.entityId.split('.').slice(1).join('.').toLowerCase()
                                                const aBase = a.entity_id.split('.').slice(1).join('.').toLowerCase()
                                                const bBase = b.entity_id.split('.').slice(1).join('.').toLowerCase()
                                                const aRelated = aBase.includes(baseName)
                                                const bRelated = bBase.includes(baseName)
                                                if (aRelated && !bRelated) return -1
                                                if (!aRelated && bRelated) return 1
                                                return 0
                                              })
                                              .map(entity => ({
                                                value: entity.entity_id,
                                                label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})${vacuum.entityId && entity.entity_id.split('.').slice(1).join('.').toLowerCase().includes(vacuum.entityId.split('.').slice(1).join('.').toLowerCase()) ? ' ⭐' : ''}`
                                              }))
                                          ]}
                                          placeholder="-- בחר ישות מפה (אופציונלי) --"
                                          className="w-full"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newConfigs = [...vacuumConfigs]
                                          const currentMapIds = vacuum.mapEntityIds || (vacuum.mapEntityId ? [vacuum.mapEntityId] : [])
                                          const updatedMapIds = currentMapIds.filter((_, i) => i !== mapIndex)
                                          newConfigs[index] = {
                                            ...vacuum,
                                            mapEntityIds: updatedMapIds,
                                            mapEntityId: updatedMapIds[0] || null // Первая карта для обратной совместимости
                                          }
                                          setVacuumConfigs(newConfigs)
                                          setHasUnsavedChanges(true)
                                        }}
                                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center text-xs font-medium flex-shrink-0"
                                        title="הסר מפה"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))
                                })()}
                              </div>
                              <p className="text-[10px] text-dark-textSecondary mt-1">
                                ⭐ = ישות קשורה אוטומטית. לחץ על + כדי להוסיף מפות נוספות
                              </p>
                            </div>

                            {/* Показываем все найденные связанные entities */}
                            {vacuum.relatedEntities && vacuum.relatedEntities.length > 0 && (
                              <div className="space-y-2">
                                <label className="block text-xs text-dark-textSecondary mb-1">
                                  ישויות קשורות נוספות ({vacuum.relatedEntities.filter(re => {
                                    const reEntityId = typeof re === 'string' ? re : re.entityId
                                    const mapIds = vacuum.mapEntityIds || (vacuum.mapEntityId ? [vacuum.mapEntityId] : [])
                                    return !mapIds.includes(reEntityId)
                                  }).length}):
                                </label>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {vacuum.relatedEntities
                                    .filter(re => {
                                      const reEntityId = typeof re === 'string' ? re : re.entityId
                                      const mapIds = vacuum.mapEntityIds || (vacuum.mapEntityId ? [vacuum.mapEntityId] : [])
                                      return !mapIds.includes(reEntityId) // Исключаем map entities, т.к. у них есть отдельное поле
                                    })
                                    .map((relatedEntity, reIndex) => {
                                      const reEntityId = typeof relatedEntity === 'string' ? relatedEntity : relatedEntity.entityId
                                      const reType = typeof relatedEntity === 'string' ? 'other' : relatedEntity.type
                                      const reName = typeof relatedEntity === 'string' ? undefined : relatedEntity.name

                                      const entity = entities.find(e => e.entity_id === reEntityId)
                                      const displayName = reName || entity?.attributes.friendly_name || reEntityId.split('.').slice(1).join('.')

                                      return (
                                        <div key={reIndex} className="flex items-center gap-2">
                                          <SearchableSelect
                                            value={reEntityId}
                                            onChange={(selectedEntityId) => {
                                              const newConfigs = [...vacuumConfigs]
                                              const currentRelated = vacuum.relatedEntities || []
                                              const updatedRelated = currentRelated.map((re, idx) => {
                                                if (idx === reIndex) {
                                                  const newEntityId = selectedEntityId || reEntityId
                                                  const newEntity = entities.find(e => e.entity_id === newEntityId)
                                                  return {
                                                    entityId: newEntityId,
                                                    type: typeof re === 'string' ? 'other' : re.type,
                                                    name: newEntity?.attributes.friendly_name || newEntityId.split('.').slice(1).join('.')
                                                  }
                                                }
                                                return typeof re === 'string' ? { entityId: re, type: 'other' as const } : re
                                              })
                                              newConfigs[index] = { ...vacuum, relatedEntities: updatedRelated }
                                              setVacuumConfigs(newConfigs)
                                              setHasUnsavedChanges(true)
                                            }}
                                            options={[
                                              { value: reEntityId, label: `${displayName} (${reEntityId}) ⭐` },
                                              ...entities
                                                .filter(e => {
                                                  // Фильтруем по типу entity
                                                  if (reType === 'sensor') return e.entity_id.startsWith('sensor.')
                                                  if (reType === 'camera') return e.entity_id.startsWith('camera.')
                                                  if (reType === 'image') return e.entity_id.startsWith('image.')
                                                  if (reType === 'map') {
                                                    const eId = e.entity_id.toLowerCase()
                                                    return e.entity_id.startsWith('camera.') ||
                                                      e.entity_id.startsWith('image.') ||
                                                      (e.entity_id.startsWith('sensor.') && (eId.includes('map') || eId.includes('mappin')))
                                                  }
                                                  return true
                                                })
                                                .filter(e => e.entity_id !== reEntityId)
                                                .map(entity => ({
                                                  value: entity.entity_id,
                                                  label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                                }))
                                            ]}
                                            placeholder={`-- ${displayName} --`}
                                            className="w-full"
                                          />
                                          <button
                                            onClick={() => {
                                              const newConfigs = [...vacuumConfigs]
                                              const currentRelated = vacuum.relatedEntities || []
                                              const updatedRelated = currentRelated.filter((_, idx) => idx !== reIndex)
                                              newConfigs[index] = { ...vacuum, relatedEntities: updatedRelated }
                                              setVacuumConfigs(newConfigs)
                                              setHasUnsavedChanges(true)
                                            }}
                                            className="px-2 py-1 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                                            title="הסר"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין שואב אבק בווידג'ט</p>
                          <p className="text-xs mb-4 text-dark-textSecondary">
                            ניתן להוסיף מספר בלתי מוגבל של שואבי אבק
                          </p>
                          <button
                            onClick={() => {
                              const newVacuum: VacuumConfig = {
                                name: 'שואב אבק 1',
                                entityId: null,
                                mapEntityId: null,
                                mapEntityIds: [],
                                relatedEntities: []
                              }
                              setVacuumConfigs([newVacuum])
                              setHasUnsavedChanges(true)
                              setToast({
                                message: 'נוסף שואב אבק ראשון. ניתן להוסיף עוד שואבי אבק ללא הגבלה.',
                                type: 'success'
                              })
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl mx-auto"
                            title="הוסף שואב אבק ראשון"
                          >
                            <Navigation size={16} />
                            הוסף שואב אבק ראשון
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Sparkles size={18} className="text-green-400" />
                          </div>
                          <div className="font-medium text-white">Vacuum</div>
                        </div>
                        <VacuumPreview configs={vacuumConfigs} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'cameras' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Cameras Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת וידג'ט מצלמות
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newCamera: CameraConfig = {
                              name: `מצלמה ${cameraConfigs.length + 1}`,
                              entityId: null
                            }
                            setCameraConfigs([...cameraConfigs, newCamera])
                            setHasUnsavedChanges(true)
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="Добавить камеру"
                        >
                          <Camera size={16} />
                          Добавить камеру
                        </button>
                        {hasUnsavedChanges && (
                          <button
                            onClick={async () => {
                              try {
                                await updateCameraConfigs(cameraConfigs)
                                setHasUnsavedChanges(false)
                                window.dispatchEvent(new Event('widgets-changed'))
                                setToast({ message: 'הגדרות מצלמות נשמרו!', type: 'success' })
                              } catch (error) {
                                console.error('Ошибка сохранения:', error)
                                setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                            title="Сохранить изменения"
                          >
                            <Save size={16} />
                            Сохранить
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="cameras-style-select" className="text-sm text-dark-textSecondary">
                          Стиль отображения:
                        </label>
                        <select
                          id="cameras-style-select"
                          value={camerasStyle}
                          onChange={(e) => {
                            const newStyle = e.target.value as CamerasStyle
                            setCamerasStyle(newStyle)
                            updateCamerasStyle(newStyle)
                            window.dispatchEvent(new Event('widgets-changed'))
                          }}
                          className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="list">Список</option>
                          <option value="card">Карточки</option>
                          <option value="compact">Компактный</option>
                          <option value="grid">Сетка</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setShowCamerasDemo(!showCamerasDemo)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${showCamerasDemo
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-dark-bg hover:bg-dark-cardHover text-dark-textSecondary border border-dark-border'
                          }`}
                      >
                        <Sparkles size={16} />
                        {showCamerasDemo ? 'Скрыть демо' : 'Показать демо'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {cameraConfigs && cameraConfigs.length > 0 ? cameraConfigs.map((camera, index) => (
                        <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                Название камеры:
                              </label>
                              <input
                                type="text"
                                value={camera.name}
                                onChange={(e) => {
                                  const newConfigs = [...cameraConfigs]
                                  newConfigs[index].name = e.target.value
                                  setCameraConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Название камеры"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Удалить эту камеру?')) {
                                  const newConfigs = cameraConfigs.filter((_, i) => i !== index)
                                  setCameraConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                              title="Удалить эту камеру"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-dark-textSecondary mb-1">
                              Entity ID камеры: {camera.entityId || 'Не выбрано'}
                            </label>
                            <SearchableSelect
                              value={camera.entityId || ''}
                              onChange={(selectedEntityId) => {
                                const entityId = selectedEntityId || null
                                let friendlyName = camera.name
                                if (entityId) {
                                  const entity = entities.find(e => e.entity_id === entityId)
                                  if (entity && entity.attributes.friendly_name) {
                                    friendlyName = entity.attributes.friendly_name
                                  }
                                }
                                const newConfigs = [...cameraConfigs]
                                newConfigs[index] = { entityId, name: friendlyName }
                                setCameraConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }}
                              options={[
                                { value: '', label: '-- בחר מצלמה --' },
                                ...entities
                                  .filter(e => {
                                    const domain = e.entity_id.split('.')[0]
                                    return domain === 'camera' || domain === 'image'
                                  })
                                  .map(entity => ({
                                    value: entity.entity_id,
                                    label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                  }))
                              ]}
                              placeholder="-- בחר מצלמה --"
                              className="w-full"
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין מצלמות בווידג'ט</p>
                          <button
                            onClick={() => {
                              const newCamera: CameraConfig = {
                                name: 'מצלמה 1',
                                entityId: null
                              }
                              setCameraConfigs([newCamera])
                              setHasUnsavedChanges(true)
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Добавить первую камеру
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של וידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Camera size={18} className="text-blue-400" />
                          </div>
                          <div className="font-medium text-white">Cameras</div>
                        </div>
                        <CamerasPreview configs={cameraConfigs} style={camerasStyle} demo={showCamerasDemo} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'ac' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">AC Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת וידג'ט מזגן
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newAC: ACConfig = {
                              name: `מזגן ${acConfigs.length + 1}`,
                              entityId: null
                            }
                            setACConfigs([...acConfigs, newAC])
                            setHasUnsavedChanges(true)
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="הוסף מזגן חדש"
                        >
                          +
                        </button>
                        {hasUnsavedChanges && (
                          <button
                            onClick={async () => {
                              try {
                                await updateACConfigs(acConfigs)
                                setHasUnsavedChanges(false)
                                window.dispatchEvent(new Event('widgets-changed'))
                                setToast({ message: 'הגדרות מזגנים נשמרו!', type: 'success' })
                              } catch (error) {
                                console.error('Ошибка сохранения:', error)
                                setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                            title="שמור שינויים"
                          >
                            <Save size={16} />
                            שמור
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                      {acConfigs && acConfigs.length > 0 ? acConfigs.map((ac, index) => (
                        <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-xs text-dark-textSecondary mb-1">
                                Название кондиционера:
                              </label>
                              <input
                                type="text"
                                value={ac.name}
                                onChange={(e) => {
                                  const newConfigs = [...acConfigs]
                                  newConfigs[index].name = e.target.value
                                  setACConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }}
                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="שם המזגן"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('למחוק את המזגן הזה?')) {
                                  const newConfigs = acConfigs.filter((_, i) => i !== index)
                                  setACConfigs(newConfigs)
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                              title="מחק את המזגן הזה"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-dark-textSecondary mb-1">
                              מזהה ישות של מזגן: {ac.entityId || 'לא מקושר'}
                            </label>
                            <SearchableSelect
                              value={ac.entityId || ''}
                              onChange={(selectedEntityId) => {
                                const entityId = selectedEntityId || null
                                let friendlyName = ac.name
                                if (entityId) {
                                  const entity = entities.find(e => e.entity_id === entityId)
                                  if (entity && entity.attributes.friendly_name) {
                                    friendlyName = entity.attributes.friendly_name
                                  }
                                }
                                const newConfigs = [...acConfigs]
                                newConfigs[index] = { entityId, name: friendlyName }
                                setACConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }}
                              options={[
                                { value: '', label: '-- בחר מזגן --' },
                                ...entities
                                  .filter(e => {
                                    const domain = e.entity_id.split('.')[0]
                                    return domain === 'climate'
                                  })
                                  .map(entity => ({
                                    value: entity.entity_id,
                                    label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                  }))
                              ]}
                              placeholder="-- בחר מזגן --"
                              className="w-full"
                            />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-dark-textSecondary py-8">
                          <p className="mb-4">אין מזגנים בווידג'ט</p>
                          <button
                            onClick={() => {
                              const newAC: ACConfig = {
                                name: 'מזגן 1',
                                entityId: null
                              }
                              setACConfigs([newAC])
                              setHasUnsavedChanges(true)
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            הוסף מזגן ראשון
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Wind size={18} className="text-cyan-400" />
                          </div>
                          <div className="font-medium text-white">AC</div>
                        </div>
                        <ACPreview configs={acConfigs} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedWidget === 'water-heater' && (
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                          title="חזור לבחירת וידג'ט"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="font-medium text-lg">Water Heater Widget</h2>
                          <p className="text-sm text-dark-textSecondary mt-1">
                            הגדרת וידג'ט דוד מים גז
                          </p>
                        </div>
                      </div>
                      {hasUnsavedChanges && (
                        <button
                          onClick={async () => {
                            try {
                              await updateWaterHeaterConfig(waterHeaterConfig)
                              setHasUnsavedChanges(false)
                              window.dispatchEvent(new Event('widgets-changed'))
                              setToast({ message: 'הגדרות דוד מים נשמרו!', type: 'success' })
                            } catch (error) {
                              console.error('Ошибка сохранения:', error)
                              setToast({ message: 'שגיאה בשמירת ההגדרות', type: 'error' })
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                          title="Сохранить изменения"
                        >
                          <Save size={16} />
                          Сохранить
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                        <div className="flex-1">
                          <label className="block text-xs text-dark-textSecondary mb-1">
                            Название водонагревателя:
                          </label>
                          <input
                            type="text"
                            value={waterHeaterConfig.name}
                            onChange={(e) => {
                              setWaterHeaterConfig({ ...waterHeaterConfig, name: e.target.value })
                              setHasUnsavedChanges(true)
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="שם דוד המים"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-dark-textSecondary mb-1">
                            מזהה ישות של דוד מים: {waterHeaterConfig.entityId || 'לא מקושר'}
                          </label>
                          <SearchableSelect
                            value={waterHeaterConfig.entityId || ''}
                            onChange={(selectedEntityId) => {
                              const entityId = selectedEntityId || null
                              let friendlyName = waterHeaterConfig.name
                              if (entityId) {
                                const entity = entities.find(e => e.entity_id === entityId)
                                if (entity && entity.attributes.friendly_name) {
                                  friendlyName = entity.attributes.friendly_name
                                }
                              }
                              setWaterHeaterConfig({ entityId, name: friendlyName })
                              setHasUnsavedChanges(true)
                            }}
                            options={[
                              { value: '', label: '-- בחר דוד מים --' },
                              ...entities
                                .filter(e => {
                                  const domain = e.entity_id.split('.')[0]
                                  return domain === 'water_heater' || domain === 'climate'
                                })
                                .map(entity => ({
                                  value: entity.entity_id,
                                  label: `${entity.attributes.friendly_name || entity.entity_id} (${entity.entity_id})`
                                }))
                            ]}
                            placeholder="-- בחר דוד מים --"
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-dark-textSecondary mb-1">
                            סגנון וידג'ט:
                          </label>
                          <select
                            value={waterHeaterStyle}
                            onChange={async (e) => {
                              const newStyle = e.target.value as WaterHeaterStyle
                              setWaterHeaterStyle(newStyle)
                              await updateWaterHeaterStyle(newStyle)
                              setWaterHeaterConfig({ ...waterHeaterConfig, style: newStyle })
                              setHasUnsavedChanges(true)
                              window.dispatchEvent(new Event('widgets-changed'))
                            }}
                            className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="compact">קומפקטי</option>
                            <option value="card">כרטיס</option>
                            <option value="minimal">מינימליסטי</option>
                            <option value="modern">מודרני</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {/* Preview виджета */}
                    <div className="lg:border-l lg:border-dark-border lg:pl-4">
                      <h3 className="text-sm font-medium text-dark-textSecondary mb-3">תצוגה מקדימה של הווידג'ט:</h3>
                      <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                          <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Droplet size={18} className="text-orange-400" />
                          </div>
                          <div className="font-medium text-white">Water Heater</div>
                        </div>
                        <WaterHeaterPreview config={waterHeaterConfig} style={waterHeaterStyle} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Список всех устройств */
        <>
          {/* Поиск и фильтры */}
          <div className="bg-dark-card rounded-lg p-4 border border-dark-border mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary" size={20} />
                <input
                  type="text"
                  placeholder="חיפוש לפי שם או entity_id..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">כל הדומיינים</option>
                {getUniqueDomains().map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
              <button
                onClick={loadEntities}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                רענן
              </button>
            </div>

            <div className="text-sm text-dark-textSecondary">
              נמצא: {filteredEntities.length} מתוך {entities.length} ישויות
            </div>
          </div>

          {/* Список сущностей */}
          <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border">
              <h2 className="font-medium">כל מכשירי Home Assistant</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-dark-textSecondary">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  טוען...
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="p-8 text-center text-dark-textSecondary">
                  לא נמצאו ישויות
                </div>
              ) : (
                <div className="divide-y divide-dark-border">
                  {filteredEntities.map((entity) => {
                    const domain = getDomain(entity.entity_id)
                    const friendlyName = entity.attributes.friendly_name || entity.entity_id
                    const switchable = isSwitchable(entity)

                    return (
                      <div
                        key={entity.entity_id}
                        className="p-4 hover:bg-dark-cardHover transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              {getEntityIcon(entity)}
                              <span className="font-medium">{friendlyName}</span>
                              <span className="text-xs text-dark-textSecondary bg-dark-bg px-2 py-1 rounded">
                                {domain}
                              </span>
                            </div>
                            <div className="text-sm text-dark-textSecondary font-mono">
                              {entity.entity_id}
                            </div>
                            <div className="text-xs text-dark-textSecondary mt-1">
                              Состояние: <span className="text-white">{entity.state}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {switchable && (
                              <span className="text-xs bg-green-900 bg-opacity-30 text-green-300 px-2 py-1 rounded">
                                Переключатель
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast уведомления */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Settings

