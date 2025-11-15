import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import { Entity } from '../services/homeAssistantAPI'
import { Search, RefreshCw, Lightbulb, Power, Settings as SettingsIcon, List, Tv, Camera, Gauge, Save, ArrowLeft, Wind, Music, Droplet, Activity, User, Gauge as GaugeIcon, Clock } from 'lucide-react'
import { getAmbientLightingConfigSync, updateAmbientLightingConfig, LightConfig, getACConfigsSync, updateACConfigs, ACConfig, getWaterHeaterConfigSync, updateWaterHeaterConfig, WaterHeaterConfig, getSensorsConfigSync, updateSensorsConfig, SensorConfig, getMotorConfigsSync, updateMotorConfigs, MotorConfig, isWidgetEnabledSync, setWidgetEnabled } from '../services/widgetConfig'
import { getConnectionConfig, saveConnectionConfig } from '../services/apiService'
import ToggleSwitch from './ui/ToggleSwitch'
import Toast from './ui/Toast'
import SearchableSelect from './ui/SearchableSelect'

type Tab = 'devices' | 'widgets' | 'home-assistant'
type WidgetType = 'ambient-lighting' | 'tv-time' | 'sensors' | 'cameras' | 'ac' | 'water-heater' | 'motors' | null

interface WidgetOption {
  id: WidgetType
  name: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
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
      return { entityId: null, name: 'Водонагреватель' }
    }
  })
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>(() => {
    try {
      return getSensorsConfigSync()
    } catch {
      return []
    }
  })
  const [motorConfigs, setMotorConfigs] = useState<MotorConfig[]>(() => {
    try {
      return getMotorConfigsSync()
    } catch {
      return []
    }
  })
  const [haUrl, setHaUrl] = useState('http://192.168.3.12:8123')
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
      description: 'Управление переключателями освещения',
      icon: Lightbulb,
      color: 'bg-yellow-500'
    },
    {
      id: 'tv-time',
      name: 'TV Time Widget',
      description: 'Настройка времени работы телевизора',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'media-player',
      name: 'Media Player Widget',
      description: 'Управление медиаплеерами',
      icon: Tv,
      color: 'bg-purple-500'
    },
    {
      id: 'spotify',
      name: 'Spotify Widget',
      description: 'Управление Spotify',
      icon: Music,
      color: 'bg-green-500'
    },
    {
      id: 'media-room',
      name: 'Media Room Widget',
      description: 'Управление медиа комнатой',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'canvas',
      name: 'Canvas Widget',
      description: 'Управление Canvas',
      icon: Tv,
      color: 'bg-purple-500'
    },
    {
      id: 'tv-preview',
      name: 'TV Preview Widget',
      description: 'Превью телевизора',
      icon: Tv,
      color: 'bg-orange-500'
    },
    {
      id: 'plex',
      name: 'Plex Widget',
      description: 'Управление Plex',
      icon: Tv,
      color: 'bg-orange-500'
    },
    {
      id: 'tv-duration',
      name: 'TV Duration Widget',
      description: 'Статистика времени просмотра',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'weather-calendar',
      name: 'Weather Calendar Widget',
      description: 'Погода и календарь',
      icon: Gauge,
      color: 'bg-cyan-500'
    },
    {
      id: 'living-room',
      name: 'Living Room Widget',
      description: 'Управление гостиной',
      icon: Tv,
      color: 'bg-blue-500'
    },
    {
      id: 'ac',
      name: 'AC Widget',
      description: 'Управление кондиционером',
      icon: Wind,
      color: 'bg-cyan-500'
    },
    {
      id: 'water-heater',
      name: 'Water Heater Widget',
      description: 'Управление газовым водонагревателем',
      icon: Droplet,
      color: 'bg-orange-500'
    },
    {
      id: 'sensors',
      name: 'Sensors Widget',
      description: 'Управление датчиками',
      icon: Gauge,
      color: 'bg-green-500'
    },
    {
      id: 'motors',
      name: 'Motor Widget',
      description: 'Управление моторными устройствами (шторы, жалюзи, ворота)',
      icon: GaugeIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'cameras',
      name: 'Cameras Widget',
      description: 'Управление камерами',
      icon: Camera,
      color: 'bg-purple-500'
    }
  ]

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
    const sensors = getSensorsConfigSync()
    setSensorConfigs(sensors && Array.isArray(sensors) ? sensors : [])
    const motors = getMotorConfigsSync()
    setMotorConfigs(motors && Array.isArray(motors) ? motors : [])
  }

  useEffect(() => {
    // Загружаем настройки Home Assistant при открытии вкладки
    if (activeTab === 'home-assistant') {
      const loadHAConfig = async () => {
        try {
          const connection = await getConnectionConfig()
          if (connection) {
            setHaUrl(connection.url || 'http://192.168.3.12:8123')
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
      setToast({ message: 'Настройки сохранены!', type: 'success' })
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setToast({ message: 'Ошибка сохранения настроек', type: 'error' })
    }
  }

  const autoFillFromSwitches = () => {
    // Получаем все switch устройства
    const switchEntities = entities.filter(e => {
      const domain = e.entity_id.split('.')[0]
      return domain === 'switch'
    })

    if (switchEntities.length === 0) {
      alert('Не найдено switch устройств в Home Assistant')
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
    alert(`Автозаполнено ${switchEntities.length} переключателей из найденных switch устройств`)
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
      alert('Выберите элементы для удаления')
      return
    }

    if (confirm(`Удалить ${selectedItems.size} выбранных элементов?`)) {
      const newConfigs = lightConfigs.filter((_, index) => !selectedItems.has(index))
      setLightConfigs(newConfigs)
      setSelectedItems(new Set())
      setHasUnsavedChanges(true)
    }
  }

  const handleDeleteAll = () => {
    if (confirm('Удалить все элементы из виджета?')) {
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
    if (confirm('Удалить этот элемент?')) {
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Настройки Dashboard</h1>
        <p className="text-sm sm:text-base text-dark-textSecondary">
          Управление привязкой виджетов к устройствам Home Assistant
        </p>
      </div>

            {/* Вкладки */}
            <div className="flex gap-2 mb-4 sm:mb-6 border-b border-dark-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'devices'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-dark-textSecondary hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <List size={18} />
            Все устройства
          </div>
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'widgets'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-dark-textSecondary hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon size={18} />
            Настройка виджетов
          </div>
        </button>
        <button
          onClick={() => setActiveTab('home-assistant')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'home-assistant'
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
          <h2 className="text-xl font-bold mb-4">Настройка подключения к Home Assistant</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                URL Home Assistant
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
                placeholder="Введите токен доступа"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-dark-textSecondary mt-2">
                Создайте токен в профиле Home Assistant
              </p>
            </div>
            <button
              onClick={async () => {
                if (!haUrl || !haToken) {
                  setToast({ message: 'Заполните все поля', type: 'error' })
                  return
                }
                setHaLoading(true)
                try {
                  await saveConnectionConfig({ url: haUrl, token: haToken })
                  await connect(haUrl, haToken)
                  setToast({ message: 'Настройки Home Assistant сохранены и подключение установлено!', type: 'success' })
                } catch (error: any) {
                  console.error('Ошибка сохранения настроек Home Assistant:', error)
                  setToast({ message: error?.message || 'Ошибка сохранения настроек', type: 'error' })
                } finally {
                  setHaLoading(false)
                }
              }}
              disabled={haLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {haLoading ? 'Сохранение...' : 'Сохранить и подключиться'}
            </button>
          </div>
        </div>
      ) : activeTab === 'widgets' ? (
        /* Настройка виджетов */
        <div className="space-y-6">
          {!selectedWidget ? (
            /* Выбор виджета */
            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
              <h2 className="text-xl font-bold mb-2">Выберите виджет для настройки</h2>
              <p className="text-sm text-dark-textSecondary mb-6">
                Выберите виджет, который вы хотите настроить
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {widgetOptions
                  .map((widget) => {
                    const widgetId = widget.id || ''
                    const enabled = widgetEnabledStates[widgetId] ?? isWidgetEnabledSync(widgetId)
                    return { ...widget, enabled }
                  })
                  .sort((a, b) => {
                    // Сначала включенные виджеты
                    if (a.enabled && !b.enabled) return -1
                    if (!a.enabled && b.enabled) return 1
                    return 0
                  })
                  .map((widget) => {
                    const Icon = widget.icon
                    const widgetId = widget.id || ''
                    const enabled = widget.enabled
                  return (
                    <div
                      key={widget.id}
                      className="p-6 bg-dark-bg border border-dark-border rounded-lg transition-all hover:border-blue-500 hover:shadow-lg group"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${widget.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                          <Icon size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-lg">{widget.name}</h3>
                            <div onClick={(e) => e.stopPropagation()}>
                              <ToggleSwitch
                                checked={enabled}
                                onChange={() => {
                                  const newState = !enabled
                                  // Обновляем локальное состояние немедленно
                                  setWidgetEnabledStates(prev => ({
                                    ...prev,
                                    [widgetId]: newState
                                  }))
                                  // Сохраняем в конфигурацию
                                  setWidgetEnabled(widgetId, newState)
                                  // Отправляем событие для обновления dashboard
                                  window.dispatchEvent(new Event('widgets-changed'))
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-dark-textSecondary mb-3">{widget.description}</p>
                          <button
                            onClick={() => setSelectedWidget(widget.id)}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Настроить →
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
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
                    title="Вернуться к выбору виджета"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="font-medium text-lg">Ambient Lighting Widget</h2>
                    <p className="text-sm text-dark-textSecondary mt-1">
                      Настройте привязку переключателей к устройствам Home Assistant
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={autoFillFromSwitches}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    title="Автоматически заполнить все переключатели из switch устройств"
                  >
                    <RefreshCw size={16} />
                    Автозаполнить из Switch
                  </button>
                  <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    title="Добавить новый переключатель"
                  >
                    +
                  </button>
                  {hasUnsavedChanges && (
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
                      title="Сохранить изменения"
                    >
                      <Save size={16} />
                      Сохранить
                    </button>
                  )}
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
                    Выбрать все ({selectedItems.size} выбрано)
                  </span>
                  {selectedItems.size > 0 && (
                    <>
                      <button
                        onClick={handleDeleteSelected}
                        className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                      >
                        Удалить выбранные ({selectedItems.size})
                      </button>
                      <button
                        onClick={handleDeleteAll}
                        className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white rounded text-sm transition-colors"
                      >
                        Удалить все
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
                        placeholder="Название переключателя"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0"
                      title="Удалить этот элемент"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-dark-textSecondary mb-1">
                      Entity ID: {light.entityId || 'Не привязано'}
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
                        { value: '', label: '-- Выберите устройство --' },
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
                      placeholder="-- Выберите устройство --"
                      className="w-full"
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center text-dark-textSecondary py-8">
                  <p className="mb-4">Нет элементов в виджете</p>
                  <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Добавить первый переключатель
                  </button>
                </div>
              )}
              </div>
              {/* Preview виджета */}
              {lightConfigs.length > 0 && (
                <div className="lg:border-l lg:border-dark-border lg:pl-4">
                  <h3 className="text-sm font-medium text-dark-textSecondary mb-3">Предпросмотр виджета:</h3>
                  <div className="bg-dark-bg rounded-lg border border-dark-border p-4 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Lightbulb size={18} className="text-yellow-400" />
                      </div>
                      <div className="font-medium text-white">תאורה סביבתית</div>
                    </div>
                    <div className="space-y-2">
                      {lightConfigs.map((light, index) => {
                        const isOn = light.entityId ? (previewEntities.get(light.entityId)?.state === 'on') : false
                        const hasEntity = light.entityId !== null
                        const Icon = light.icon === 'clock' ? Clock : Lightbulb

                        return (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Icon size={16} className={`${isOn ? 'text-yellow-400' : 'text-dark-textSecondary'} flex-shrink-0`} />
                              <span className={`text-sm truncate ${isOn ? 'text-white' : 'text-dark-textSecondary'}`} title={light.name}>
                                {light.name || 'Без названия'}
                              </span>
                              {!hasEntity && (
                                <span className="text-xs text-red-400 ml-2 flex-shrink-0">Не настроено</span>
                              )}
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                              isOn ? 'bg-blue-600' : 'bg-gray-600'
                            } ${!hasEntity ? 'opacity-50' : ''}`}>
                              <div className={`w-5 h-5 rounded-full bg-white transition-transform mt-0.5 ${
                                isOn ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
          {selectedWidget === 'tv-time' && (
            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setSelectedWidget(null)}
                  className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                  title="Вернуться к выбору виджета"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="font-medium text-lg">TV Time Widget</h2>
                  <p className="text-sm text-dark-textSecondary mt-1">
                    Настройка виджета времени работы телевизора
                  </p>
                </div>
              </div>
              <div className="text-center text-dark-textSecondary py-8">
                Настройки TV Time Widget (в разработке)
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
                      title="Вернуться к выбору виджета"
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
                          name: `Датчик движения ${sensorConfigs.filter(s => s.type === 'motion').length + 1}`,
                          entityId: null,
                          type: 'motion'
                        }
                        setSensorConfigs([...sensorConfigs, newSensor])
                        setHasUnsavedChanges(true)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      title="Добавить датчик движения"
                    >
                      <Activity size={16} />
                      Добавить движение
                    </button>
                    <button
                      onClick={() => {
                        const newSensor: SensorConfig = {
                          name: `Датчик присутствия ${sensorConfigs.filter(s => s.type === 'presence').length + 1}`,
                          entityId: null,
                          type: 'presence'
                        }
                        setSensorConfigs([...sensorConfigs, newSensor])
                        setHasUnsavedChanges(true)
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      title="Добавить датчик присутствия"
                    >
                      <User size={16} />
                      Добавить присутствие
                    </button>
                    {hasUnsavedChanges && (
                      <button
                        onClick={async () => {
                          try {
                            await updateSensorsConfig(sensorConfigs)
                            setHasUnsavedChanges(false)
                            window.dispatchEvent(new Event('widgets-changed'))
                            setToast({ message: 'Настройки датчиков сохранены!', type: 'success' })
                          } catch (error) {
                            console.error('Ошибка сохранения:', error)
                            setToast({ message: 'Ошибка сохранения настроек', type: 'error' })
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
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
                {sensorConfigs && sensorConfigs.length > 0 ? sensorConfigs.map((sensor, index) => (
                  <div key={index} className="p-4 bg-dark-bg rounded-lg border border-dark-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          sensor.type === 'motion' ? 'bg-blue-500/20' : 'bg-green-500/20'
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
                            placeholder="Название датчика"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={sensor.type}
                            onChange={(e) => {
                              const newConfigs = [...sensorConfigs]
                              newConfigs[index].type = e.target.value as 'motion' | 'presence'
                              setSensorConfigs(newConfigs)
                              setHasUnsavedChanges(true)
                            }}
                            className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="motion">Движение</option>
                            <option value="presence">Присутствие</option>
                          </select>
                          <button
                            onClick={() => {
                              if (confirm('Удалить этот датчик?')) {
                                const newConfigs = sensorConfigs.filter((_, i) => i !== index)
                                setSensorConfigs(newConfigs)
                                setHasUnsavedChanges(true)
                              }
                            }}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0"
                            title="Удалить этот датчик"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-dark-textSecondary mb-1">
                        Entity ID датчика: {sensor.entityId || 'Не привязано'}
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
                          { value: '', label: '-- Выберите датчик --' },
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
                        placeholder="-- Выберите датчик --"
                        className="w-full"
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-dark-textSecondary py-8">
                    <p className="mb-4">Нет датчиков в виджете</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          const newSensor: SensorConfig = {
                            name: 'Датчик движения 1',
                            entityId: null,
                            type: 'motion'
                          }
                          setSensorConfigs([newSensor])
                          setHasUnsavedChanges(true)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Activity size={16} />
                        Добавить датчик движения
                      </button>
                      <button
                        onClick={() => {
                          const newSensor: SensorConfig = {
                            name: 'Датчик присутствия 1',
                            entityId: null,
                            type: 'presence'
                          }
                          setSensorConfigs([newSensor])
                          setHasUnsavedChanges(true)
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <User size={16} />
                        Добавить датчик присутствия
                      </button>
                    </div>
                  </div>
                )}
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
                      title="Вернуться к выбору виджета"
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
                          name: `Мотор ${motorConfigs.length + 1}`,
                          entityId: null
                        }
                        setMotorConfigs([...motorConfigs, newMotor])
                        setHasUnsavedChanges(true)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      title="Добавить новое моторное устройство"
                    >
                      <GaugeIcon size={16} />
                      Добавить мотор
                    </button>
                    {hasUnsavedChanges && (
                      <button
                        onClick={async () => {
                          try {
                            await updateMotorConfigs(motorConfigs)
                            setHasUnsavedChanges(false)
                            window.dispatchEvent(new Event('widgets-changed'))
                            setToast({ message: 'Настройки моторных устройств сохранены!', type: 'success' })
                          } catch (error) {
                            console.error('Ошибка сохранения:', error)
                            setToast({ message: 'Ошибка сохранения настроек', type: 'error' })
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
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
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
                          placeholder="Название моторного устройства"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Удалить это моторное устройство?')) {
                            const newConfigs = motorConfigs.filter((_, i) => i !== index)
                            setMotorConfigs(newConfigs)
                            setHasUnsavedChanges(true)
                          }
                        }}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                        title="Удалить это моторное устройство"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-dark-textSecondary mb-1">
                        Entity ID моторного устройства: {motor.entityId || 'Не привязано'}
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
                          { value: '', label: '-- Выберите моторное устройство --' },
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
                        placeholder="-- Выберите моторное устройство --"
                        className="w-full"
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-dark-textSecondary py-8">
                    <p className="mb-4">Нет моторных устройств в виджете</p>
                    <button
                      onClick={() => {
                        const newMotor: MotorConfig = {
                          name: 'Мотор 1',
                          entityId: null
                        }
                        setMotorConfigs([newMotor])
                        setHasUnsavedChanges(true)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Добавить первое моторное устройство
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedWidget === 'cameras' && (
            <div className="bg-dark-card rounded-lg border border-dark-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setSelectedWidget(null)}
                  className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors"
                  title="Вернуться к выбору виджета"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="font-medium text-lg">Cameras Widget</h2>
                  <p className="text-sm text-dark-textSecondary mt-1">
                    Настройка виджета камер
                  </p>
                </div>
              </div>
              <div className="text-center text-dark-textSecondary py-8">
                Настройки Cameras Widget (в разработке)
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
                      title="Вернуться к выбору виджета"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="font-medium text-lg">AC Widget</h2>
                      <p className="text-sm text-dark-textSecondary mt-1">
                        Настройка виджета кондиционера
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newAC: ACConfig = {
                          name: `Кондиционер ${acConfigs.length + 1}`,
                          entityId: null
                        }
                        setACConfigs([...acConfigs, newAC])
                        setHasUnsavedChanges(true)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      title="Добавить новый кондиционер"
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
                            setToast({ message: 'Настройки кондиционеров сохранены!', type: 'success' })
                          } catch (error) {
                            console.error('Ошибка сохранения:', error)
                            setToast({ message: 'Ошибка сохранения настроек', type: 'error' })
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
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
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
                          placeholder="Название кондиционера"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Удалить этот кондиционер?')) {
                            const newConfigs = acConfigs.filter((_, i) => i !== index)
                            setACConfigs(newConfigs)
                            setHasUnsavedChanges(true)
                          }
                        }}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0 ml-2"
                        title="Удалить этот кондиционер"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-dark-textSecondary mb-1">
                        Entity ID кондиционера: {ac.entityId || 'Не привязано'}
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
                          { value: '', label: '-- Выберите кондиционер --' },
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
                        placeholder="-- Выберите кондиционер --"
                        className="w-full"
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-dark-textSecondary py-8">
                    <p className="mb-4">Нет кондиционеров в виджете</p>
                    <button
                      onClick={() => {
                        const newAC: ACConfig = {
                          name: 'Кондиционер 1',
                          entityId: null
                        }
                        setACConfigs([newAC])
                        setHasUnsavedChanges(true)
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Добавить первый кондиционер
                    </button>
                  </div>
                )}
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
                      title="Вернуться к выбору виджета"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="font-medium text-lg">Water Heater Widget</h2>
                      <p className="text-sm text-dark-textSecondary mt-1">
                        Настройка виджета газового водонагревателя
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
                          setToast({ message: 'Настройки водонагревателя сохранены!', type: 'success' })
                        } catch (error) {
                          console.error('Ошибка сохранения:', error)
                          setToast({ message: 'Ошибка сохранения настроек', type: 'error' })
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
              <div className="p-4 space-y-4">
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
                      placeholder="Название водонагревателя"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-dark-textSecondary mb-1">
                      Entity ID водонагревателя: {waterHeaterConfig.entityId || 'Не привязано'}
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
                        { value: '', label: '-- Выберите водонагреватель --' },
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
                      placeholder="-- Выберите водонагреватель --"
                      className="w-full"
                    />
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
              placeholder="Поиск по названию или entity_id..."
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
            <option value="all">Все домены</option>
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
            Обновить
          </button>
        </div>

        <div className="text-sm text-dark-textSecondary">
          Найдено: {filteredEntities.length} из {entities.length} сущностей
        </div>
      </div>

      {/* Список сущностей */}
      <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="font-medium">Все устройства Home Assistant</h2>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-dark-textSecondary">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Загрузка...
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="p-8 text-center text-dark-textSecondary">
              Сущности не найдены
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

