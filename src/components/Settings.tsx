import { useState, useEffect, useCallback } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
// import { Entity } from '../services/homeAssistantAPI' // MEDIUM: Закомментировано, чтобы использовать any
import { Search, RefreshCw, Lightbulb, Power, List } from 'lucide-react'
import { getAmbientLightingConfig, updateAmbientLightingConfig, LightConfig } from '../services/widgetConfig'
import Toast from './ui/Toast'

type Tab = 'devices'

const Settings = () => {
  const { api } = useHomeAssistant()
  const [activeTab, setActiveTab] = useState<Tab>('devices')
  const [entities, setEntities] = useState<any[]>([])
  const [filteredEntities, setFilteredEntities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [lightConfigs, setLightConfigs] = useState<LightConfig[]>(() => {
    try {
      return getAmbientLightingConfig()
    } catch {
      return []
    }
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    const loadEntities = async () => {
      if (!api) return
      setLoading(true)
      try {
        const allEntities = await api.getStates()
        setEntities(allEntities)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    filterEntities = () => {
      let filtered = entities

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(e =>
          e.entity_id.toLowerCase().includes(term) ||
          (e.attributes.friendly_name || '').toLowerCase().includes(term)
        )
      }

      setFilteredEntities(filtered)
    }
    loadEntities()
    filterEntities()


  }, [api, entities, searchTerm])

  useEffect(() => {

    const intervalId = setInterval(() => {
      console.log("Checking entities in background...");
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);


  const handleSave = () => {
    updateAmbientLightingConfig(lightConfigs)
    setHasUnsavedChanges(false)
    window.dispatchEvent(new Event('widgets-changed'))
    setToast({ message: 'Настройки сохранены!', type: 'success' })
  }
  let filterEntities: () => void = () => { }

  const getEntityIcon = (entity: any) => {
    const domain = entity.entity_id.split('.')[0]
    if (domain === 'light') return <Lightbulb size={16} className="text-yellow-500" />
    return <Power size={16} className="text-blue-500" />
  }
  const handleLightEntityChange = (index: number, entityId: string | null) => {
    const newConfigs = [...lightConfigs]
    newConfigs[index] = { ...newConfigs[index], entityId }
    setLightConfigs(newConfigs)
    setHasUnsavedChanges(true)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard settings</h1>
        <p className="text-dark-textSecondary">
          Manage widget mapping to Home Assistant devices
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
            All devices
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
                  placeholder="Search by name or entity_id..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
            <div className="p-4 border-b border-dark-border">
              <h2 className="font-medium">All Home Assistant devices</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-dark-textSecondary">
                  Loading...
                </div>
              ) : (
                <div className="divide-y divide-dark-border">
                  {filteredEntities.map((entity) => {
                    const domain = entity.entity_id.split('.')[0]
                    const friendlyName = entity.attributes.friendly_name || entity.entity_id
                    const sanitizedFriendlyName = friendlyName.replace(/[<>]/g, (tag) => {
                      switch (tag) {
                        case '<':
                          return '&lt;';
                        case '>':
                          return '&gt;';
                        default:
                          return tag;
                      }
                    });
                    return (
                      <div
                        key={entity.entity_id}
                        className="p-4 hover:bg-dark-cardHover transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              {getEntityIcon(entity)}
                              <span
                                className="font-medium"
                                dangerouslySetInnerHTML={{ __html: sanitizedFriendlyName }}
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
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Settings