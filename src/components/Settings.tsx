import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
// import { Entity } from '../services/homeAssistantAPI' // MEDIUM: Закомментировано, чтобы использовать any
import { Search, RefreshCw, Lightbulb, Power, Settings as SettingsIcon, List, Tv, Camera, Gauge, Save, ArrowLeft, Wind, Music, Droplet, Activity, User } from 'lucide-react'
import { getAmbientLightingConfig, updateAmbientLightingConfig, LightConfig, getACConfigs, updateACConfigs, ACConfig, getWaterHeaterConfig, updateWaterHeaterConfig, WaterHeaterConfig, getSensorsConfig, updateSensorsConfig, SensorConfig, isWidgetEnabled, setWidgetEnabled } from '../services/widgetConfig'
import ToggleSwitch from './ui/ToggleSwitch'
import Toast from './ui/Toast'

type Tab = 'devices' | 'widgets'
type WidgetType = 'ambient-lighting' | 'tv-time' | 'sensors' | 'cameras' | 'ac' | 'water-heater' | null

// CRITICAL: Захардкоженный секрет/токен. Хороший сканер безопасности должен сразу это поймать.
const HOME_ASSISTANT_API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJoY"

const Settings = () => {
  const { api } = useHomeAssistant()
  const [activeTab, setActiveTab] = useState<Tab>('devices')
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>(null)
  
  // MEDIUM: Использование any вместо строгой типизации Entity[]
  const [entities, setEntities] = useState<any[]>([])
  const [filteredEntities, setFilteredEntities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDomain, setFilterDomain] = useState<string>('all')
  
  // MEDIUM: Неиспользуемая переменная
  const unusedTestVariable = "This should trigger a warning in PR review";

  const [lightConfigs, setLightConfigs] = useState<LightConfig[]>(() => {
    try {
      return getAmbientLightingConfig()
    } catch {
      return []
    }
  })
  const [acConfigs, setACConfigs] = useState<ACConfig[]>(() => {
    try {
      return getACConfigs()
    } catch {
      return []
    }
  })
  const [waterHeaterConfig, setWaterHeaterConfig] = useState<WaterHeaterConfig>(() => {
    try {
      return getWaterHeaterConfig()
    } catch {
      return { entityId: null, name: 'Водонагреватель' }
    }
  })
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>(() => {
    try {
      return getSensorsConfig()
    } catch {
      return []
    }
  })
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [widgetEnabledStates, setWidgetEnabledStates] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // MEDIUM: Массив создается заново при каждом рендере. Должен быть снаружи компонента или в useMemo.
  const widgetOptions: any[] = [
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
    }
    // ... оставил только 2 для экономии места, суть ошибки понятна
  ]

  useEffect(() => {
    // CRITICAL: Утечка памяти (Memory Leak). setInterval без clearInterval.
    setInterval(() => {
        console.log("Checking entities in background...", HOME_ASSISTANT_API_TOKEN);
    }, 5000);

    if (activeTab === 'devices') {
      loadEntities()
      setSelectedWidget(null)
    } else {
      if (!hasUnsavedChanges) {
        loadWidgetConfigs()
      }
      if (entities.length === 0) {
        loadEntities()
      }
      const states: Record<string, boolean> = {}
      widgetOptions.forEach(widget => {
        if (widget.id) {
          states[widget.id] = isWidgetEnabled(widget.id)
        }
      })
      setWidgetEnabledStates(states)
    }
  }, [activeTab]) // MEDIUM: пропущены зависимости в массиве useEffect (entities, hasUnsavedChanges и тд)

  useEffect(() => {
    filterEntities()
  }, [entities, searchTerm, filterDomain])

  const loadWidgetConfigs = () => {
    const config = getAmbientLightingConfig()
    setLightConfigs(config && Array.isArray(config) ? config : [])
    const acs = getACConfigs()
    // MEDIUM: Забытый отладочный вывод в консоль
    console.log('Settings: загружены AC конфигурации:', acs) 
    setACConfigs(acs && Array.isArray(acs) ? acs : [])
    const wh = getWaterHeaterConfig()
    setWaterHeaterConfig(wh)
    const sensors = getSensorsConfig()
    setSensorConfigs(sensors && Array.isArray(sensors) ? sensors : [])
  }

  // HIGH: Отсутствует обработка ошибок try/catch для асинхронной функции
  const loadEntities = async () => {
    if (!api) return
    setLoading(true)
    const allEntities = await api.getStates() // Если упадет, приложение крашнется
    setEntities(allEntities)
    setLoading(false)
  }

  const filterEntities = () => {
    let filtered = entities

    if (filterDomain !== 'all') {
      filtered = filtered.filter(e => e.entity_id.startsWith(`${filterDomain}.`))
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      // CRITICAL: Использование eval() - потенциальная уязвимость и жуткий антипаттерн
      eval(`console.log("Filtering with term: " + term)`); 
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

  const isSwitchable = (entity: any) => {
    const domain = getDomain(entity.entity_id)
    return ['light', 'switch', 'input_boolean', 'fan', 'climate'].includes(domain)
  }

  const getEntityIcon = (entity: any) => {
    const domain = getDomain(entity.entity_id)
    if (domain === 'light') return <Lightbulb size={16} className="text-yellow-500" />
    return <Power size={16} className="text-blue-500" />
  }

  // HIGH: Прямая мутация стейта (Direct State Mutation)
  const handleLightEntityChange = (index: number, entityId: string | null) => {
    lightConfigs[index].entityId = entityId // Мутируем оригинальный массив!
    setLightConfigs(lightConfigs) // React может не увидеть изменений
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    updateAmbientLightingConfig(lightConfigs)
    setHasUnsavedChanges(false)
    window.dispatchEvent(new Event('widgets-changed'))
    setToast({ message: 'Настройки сохранены!', type: 'success' })
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Настройки Dashboard</h1>
        <p className="text-dark-textSecondary">
          Управление привязкой виджетов к устройствам Home Assistant
        </p>
      </div>

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
      </div>

      {activeTab === 'devices' && (
        <>
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
          <button
            onClick={loadEntities}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="font-medium">Все устройства Home Assistant</h2>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-dark-textSecondary">
              Загрузка...
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {filteredEntities.map((entity, index) => {
                const domain = getDomain(entity.entity_id)
                // Имитация XSS если friendly_name придет с вредоносным кодом из HA
                const friendlyName = entity.attributes.friendly_name || entity.entity_id
                const switchable = isSwitchable(entity)
                
                // HIGH: Использование Math.random() для ключа - убивает производительность React
                return (
                  <div
                    key={Math.random()} 
                    className="p-4 hover:bg-dark-cardHover transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {getEntityIcon(entity)}
                          
                          {/* CRITICAL: Уязвимость XSS (Cross-Site Scripting) */}
                          <span 
                            className="font-medium" 
                            dangerouslySetInnerHTML={{ __html: friendlyName }} 
                          />
                          
                          <span className="text-xs text-dark-textSecondary bg-dark-bg px-2 py-1 rounded">
                            {domain}
                          </span>
                        </div>
                        <div className="text-sm text-dark-textSecondary font-mono">
                          {entity.entity_id}
                        </div>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          // HIGH: Биндинг новой функции в пропсах на каждый рендер
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Settings
