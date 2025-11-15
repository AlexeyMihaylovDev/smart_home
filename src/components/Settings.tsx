import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import { Entity } from '../services/homeAssistantAPI'
import { Search, RefreshCw, Lightbulb, Power, Settings as SettingsIcon, List, Tv, Camera, Gauge, Save, ArrowLeft, Wind, Music } from 'lucide-react'
import { getAmbientLightingConfig, updateAmbientLightingConfig, LightConfig, getACConfig, updateACConfig, ACConfig, isWidgetEnabled, setWidgetEnabled } from '../services/widgetConfig'
import ToggleSwitch from './ui/ToggleSwitch'

type Tab = 'devices' | 'widgets'
type WidgetType = 'ambient-lighting' | 'tv-time' | 'sensors' | 'cameras' | 'ac' | null

interface WidgetOption {
  id: WidgetType
  name: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}

const Settings = () => {
  const { api } = useHomeAssistant()
  const [activeTab, setActiveTab] = useState<Tab>('devices')
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [lightConfigs, setLightConfigs] = useState<LightConfig[]>(() => {
    try {
      return getAmbientLightingConfig()
    } catch {
      return []
    }
  })
  const [acConfig, setACConfig] = useState<ACConfig>(() => {
    try {
      return getACConfig()
    } catch {
      return { entityId: null, name: 'Кондиционер' }
    }
  })
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [widgetEnabledStates, setWidgetEnabledStates] = useState<Record<string, boolean>>({})

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
      id: 'sensors',
      name: 'Sensors Widget',
      description: 'Управление датчиками',
      icon: Gauge,
      color: 'bg-green-500'
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
      loadWidgetConfigs()
      // Загружаем entities для выбора в настройках виджетов
      if (entities.length === 0) {
        loadEntities()
      }
      // Загружаем состояния включенных виджетов
      const states: Record<string, boolean> = {}
      widgetOptions.forEach(widget => {
        if (widget.id) {
          states[widget.id] = isWidgetEnabled(widget.id)
        }
      })
      setWidgetEnabledStates(states)
    }
  }, [activeTab])

  useEffect(() => {
    filterEntities()
  }, [entities, searchTerm, filterDomain])

  const loadWidgetConfigs = () => {
    const config = getAmbientLightingConfig()
    setLightConfigs(config && Array.isArray(config) ? config : [])
  }

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

  const handleSave = () => {
    updateAmbientLightingConfig(lightConfigs)
    setHasUnsavedChanges(false)
    alert('Настройки сохранены!')
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Настройки Dashboard</h1>
        <p className="text-dark-textSecondary">
          Управление привязкой виджетов к устройствам Home Assistant
        </p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 mb-6 border-b border-dark-border">
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
      </div>

      {activeTab === 'widgets' ? (
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
                {widgetOptions.map((widget) => {
                  const Icon = widget.icon
                  const widgetId = widget.id || ''
                  // Используем локальное состояние для немедленного обновления
                  const enabled = widgetEnabledStates[widgetId] ?? isWidgetEnabled(widgetId)
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
            <div className="p-4 space-y-4">
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
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-dark-textSecondary mb-1">
                        Entity ID: {light.entityId || 'Не привязано'}
                      </label>
                      <select
                        value={light.entityId || ''}
                        onChange={(e) => {
                          const selectedEntityId = e.target.value || null
                          handleLightEntityChange(index, selectedEntityId)
                          // Обновляем имя из friendly_name если выбрано устройство
                          if (selectedEntityId) {
                            const entity = entities.find(e => e.entity_id === selectedEntityId)
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
                        className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Выберите устройство --</option>
                        {entities
                          .filter(e => {
                            const domain = e.entity_id.split('.')[0]
                            return ['light', 'switch', 'input_boolean'].includes(domain)
                          })
                          .map(entity => (
                            <option key={entity.entity_id} value={entity.entity_id}>
                              {entity.attributes.friendly_name || entity.entity_id} ({entity.entity_id})
                            </option>
                          ))}
                      </select>
                    </div>
                    {light.entityId && (
                      <button
                        onClick={() => {
                          const entity = entities.find(e => e.entity_id === light.entityId)
                          if (entity) {
                            navigator.clipboard.writeText(entity.entity_id)
                          }
                        }}
                        className="text-xs bg-dark-cardHover hover:bg-dark-border px-3 py-2 rounded transition-colors flex-shrink-0 whitespace-nowrap"
                        title="Копировать entity_id"
                      >
                        Копировать
                      </button>
                    )}
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
                  <h2 className="font-medium text-lg">Sensors Widget</h2>
                  <p className="text-sm text-dark-textSecondary mt-1">
                    Настройка виджета датчиков
                  </p>
                </div>
              </div>
              <div className="text-center text-dark-textSecondary py-8">
                Настройки Sensors Widget (в разработке)
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
                  {hasUnsavedChanges && (
                    <button
                      onClick={() => {
                        updateACConfig(acConfig)
                        setHasUnsavedChanges(false)
                        alert('Настройки сохранены!')
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Название виджета
                  </label>
                  <input
                    type="text"
                    value={acConfig.name}
                    onChange={(e) => {
                      setACConfig({ ...acConfig, name: e.target.value })
                      setHasUnsavedChanges(true)
                    }}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Кондиционер"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Entity ID кондиционера
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={acConfig.entityId || ''}
                      onChange={(e) => {
                        const selectedEntityId = e.target.value || null
                        let friendlyName = acConfig.name
                        if (selectedEntityId) {
                          const entity = entities.find(e => e.entity_id === selectedEntityId)
                          if (entity && entity.attributes.friendly_name) {
                            friendlyName = entity.attributes.friendly_name
                          }
                        }
                        setACConfig({ entityId: selectedEntityId, name: friendlyName })
                        setHasUnsavedChanges(true)
                      }}
                      className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Выберите кондиционер --</option>
                      {entities
                        .filter(e => {
                          const domain = e.entity_id.split('.')[0]
                          return domain === 'climate'
                        })
                        .map(entity => (
                          <option key={entity.entity_id} value={entity.entity_id}>
                            {entity.attributes.friendly_name || entity.entity_id} ({entity.entity_id})
                          </option>
                        ))}
                    </select>
                    {acConfig.entityId && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(acConfig.entityId || '')
                        }}
                        className="text-xs bg-dark-cardHover hover:bg-dark-border px-3 py-2 rounded transition-colors whitespace-nowrap"
                        title="Копировать entity_id"
                      >
                        Копировать
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-dark-textSecondary mt-2">
                    {acConfig.entityId || 'Не привязано'}
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
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(entity.entity_id)
                          }}
                          className="text-xs bg-dark-cardHover hover:bg-dark-border px-3 py-1 rounded transition-colors"
                          title="Копировать entity_id"
                        >
                          Копировать ID
                        </button>
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
    </div>
  )
}

export default Settings

