import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import { Entity } from '../services/homeAssistantAPI'
import { Search, RefreshCw, Lightbulb, Power, Settings as SettingsIcon, List } from 'lucide-react'
import { getAmbientLightingConfig, updateAmbientLightingConfig, LightConfig } from '../services/widgetConfig'

type Tab = 'devices' | 'widgets'

const Settings = () => {
  const { api } = useHomeAssistant()
  const [activeTab, setActiveTab] = useState<Tab>('devices')
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
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (activeTab === 'devices') {
      loadEntities()
    } else {
      loadWidgetConfigs()
      // Загружаем entities для выбора в настройках виджетов
      if (entities.length === 0) {
        loadEntities()
      }
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
    updateAmbientLightingConfig(newConfigs)
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
    updateAmbientLightingConfig(newConfigs)
    setSelectedItems(new Set())
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
      updateAmbientLightingConfig(newConfigs)
      setSelectedItems(new Set())
    }
  }

  const handleDeleteAll = () => {
    if (confirm('Удалить все элементы из виджета?')) {
      setLightConfigs([])
      updateAmbientLightingConfig([])
      setSelectedItems(new Set())
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
    updateAmbientLightingConfig(newConfigs)
  }

  const handleDeleteItem = (index: number) => {
    if (confirm('Удалить этот элемент?')) {
      const newConfigs = lightConfigs.filter((_, i) => i !== index)
      setLightConfigs(newConfigs)
      updateAmbientLightingConfig(newConfigs)
      const newSelected = new Set(selectedItems)
      newSelected.delete(index)
      setSelectedItems(newSelected)
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
          {/* Ambient Lighting Widget */}
          <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-medium text-lg">Ambient Lighting Widget</h2>
                  <p className="text-sm text-dark-textSecondary mt-1">
                    Настройте привязку переключателей к устройствам Home Assistant
                  </p>
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
                <div key={index} className={`flex items-center gap-4 p-3 bg-dark-bg rounded-lg border ${selectedItems.has(index) ? 'border-blue-500' : 'border-transparent'}`}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(index)}
                    onChange={() => handleToggleSelect(index)}
                    className="w-4 h-4 rounded border-dark-border bg-dark-bg text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={light.name}
                      onChange={(e) => {
                        const newConfigs = [...lightConfigs]
                        newConfigs[index].name = e.target.value
                        setLightConfigs(newConfigs)
                        updateAmbientLightingConfig(newConfigs)
                      }}
                      className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 mb-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-sm text-dark-textSecondary">
                      {light.entityId || 'Не привязано'}
                    </div>
                  </div>
                  <select
                    value={light.entityId || ''}
                    onChange={(e) => handleLightEntityChange(index, e.target.value || null)}
                    className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 min-w-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {light.entityId && (
                    <button
                      onClick={() => {
                        const entity = entities.find(e => e.entity_id === light.entityId)
                        if (entity) {
                          navigator.clipboard.writeText(entity.entity_id)
                        }
                      }}
                      className="text-xs bg-dark-cardHover hover:bg-dark-border px-3 py-2 rounded transition-colors flex-shrink-0"
                      title="Копировать entity_id"
                    >
                      Копировать
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors flex-shrink-0"
                    title="Удалить этот элемент"
                  >
                    ✕
                  </button>
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

