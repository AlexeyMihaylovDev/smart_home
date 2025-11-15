import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getBoseConfigsSync, BoseConfig } from '../../services/widgetConfig'
import { 
  Power, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, 
  Music, Radio, Bluetooth, Settings, Speaker, Battery,
  ChevronDown, ChevronUp
} from 'lucide-react'

interface BoseUnitProps {
  boseConfig: BoseConfig
  entity: Entity | null
  api: any
  loading: boolean
  onLoadingChange: (loading: boolean) => void
}

const BoseUnit = ({ boseConfig, entity, api, loading, onLoadingChange }: BoseUnitProps) => {
  const [localLoading, setLocalLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [volume, setVolume] = useState<number>(0)

  useEffect(() => {
    if (entity) {
      const volumeLevel = entity.attributes.volume_level
      if (typeof volumeLevel === 'number') {
        setVolume(Math.round(volumeLevel * 100))
      } else if (typeof volumeLevel === 'string') {
        const parsed = parseFloat(volumeLevel)
        if (!isNaN(parsed)) {
          setVolume(Math.round(parsed * 100))
        }
      }
    }
  }, [entity])

  const isOn = entity?.state === 'on' || entity?.state === 'playing'
  const isPlaying = entity?.state === 'playing'
  const isPaused = entity?.state === 'paused'
  const isOff = entity?.state === 'off' || entity?.state === 'unavailable'
  
  const mediaTitle = entity?.attributes.media_title || ''
  const mediaArtist = entity?.attributes.media_artist || ''
  const mediaAlbum = entity?.attributes.media_album_name || ''
  const mediaImage = entity?.attributes.entity_picture || ''
  const source = entity?.attributes.source || ''
  const batteryLevel = entity?.attributes.battery_level
  
  const hasMedia = !!(mediaTitle || mediaArtist)
  const friendlyName = boseConfig.name || entity?.attributes.friendly_name || boseConfig.entityId || 'Bose'

  const handlePower = async () => {
    if (!api || !boseConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      if (isOn) {
        await api.turnOff(boseConfig.entityId)
      } else {
        await api.turnOn(boseConfig.entityId)
      }
    } catch (error) {
      console.error('Ошибка управления питанием:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleVolumeChange = async (newVolume: number) => {
    if (!api || !boseConfig.entityId) return

    const clampedVolume = Math.max(0, Math.min(100, newVolume))
    setVolume(clampedVolume)

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.setVolume(boseConfig.entityId, clampedVolume)
    } catch (error) {
      console.error('Ошибка изменения громкости:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handlePlayPause = async () => {
    if (!api || !boseConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.mediaPlayPause(boseConfig.entityId)
    } catch (error) {
      console.error('Ошибка play/pause:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleNext = async () => {
    if (!api || !boseConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.mediaNext(boseConfig.entityId)
    } catch (error) {
      console.error('Ошибка next track:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handlePrevious = async () => {
    if (!api || !boseConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.mediaPrevious(boseConfig.entityId)
    } catch (error) {
      console.error('Ошибка previous track:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleSourceSelect = async (sourceName: string) => {
    if (!api || !boseConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'media_player',
        service: 'select_source',
        target: { entity_id: boseConfig.entityId },
        service_data: { source: sourceName }
      })
    } catch (error) {
      console.error('Ошибка выбора источника:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const getAvailableSources = (): string[] => {
    if (!entity) return []
    const sourceList = entity.attributes.source_list
    if (Array.isArray(sourceList)) {
      return sourceList
    }
    return []
  }

  const availableSources = getAvailableSources()

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
      {/* Заголовок с питанием */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isOn ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
            <Speaker size={16} className={`sm:w-[18px] sm:h-[18px] ${isOn ? 'text-blue-400' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm sm:text-base text-white truncate" title={friendlyName}>
              {friendlyName}
            </div>
            {source && (
              <div className="text-[10px] sm:text-xs text-dark-textSecondary truncate">
                {source}
              </div>
            )}
          </div>
          {batteryLevel !== undefined && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-dark-card border border-dark-border flex-shrink-0">
              <Battery size={12} className="text-green-400" />
              <span className="text-[10px] font-medium text-green-400">{batteryLevel}%</span>
            </div>
          )}
        </div>
        <button
          onClick={handlePower}
          disabled={localLoading || loading}
          className={`p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 ${
            isOn 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isOn ? 'כבה' : 'הדלק'}
        >
          <Power size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>

      {isOn && (
        <>
          {/* Медиа информация */}
          {hasMedia && (
            <div className="mb-2 sm:mb-3 p-2 bg-dark-card rounded-lg border border-dark-border">
              {mediaImage && (
                <div className="w-full h-24 sm:h-32 mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <img 
                    src={mediaImage.startsWith('http') ? mediaImage : `http://${window.location.hostname}:8123${mediaImage}`}
                    alt={mediaTitle || 'Album Art'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {!mediaImage && (
                    <Music size={32} className="text-blue-400 opacity-50" />
                  )}
                </div>
              )}
              <div className="space-y-0.5">
                {mediaTitle && (
                  <div className="text-xs sm:text-sm font-medium text-white truncate" title={mediaTitle}>
                    {mediaTitle}
                  </div>
                )}
                {mediaArtist && (
                  <div className="text-[10px] sm:text-xs text-dark-textSecondary truncate" title={mediaArtist}>
                    {mediaArtist}
                  </div>
                )}
                {mediaAlbum && (
                  <div className="text-[10px] text-dark-textSecondary truncate" title={mediaAlbum}>
                    {mediaAlbum}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Громкость */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {volume === 0 ? (
                  <VolumeX size={14} className="text-dark-textSecondary" />
                ) : (
                  <Volume2 size={14} className="text-blue-400" />
                )}
                <span className="text-[10px] sm:text-xs text-dark-textSecondary">עוצמת קול</span>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-white">{volume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVolumeChange(volume - 5)}
                disabled={localLoading || loading || volume <= 0}
                className="p-1 rounded bg-dark-card hover:bg-dark-cardHover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown size={12} className="text-white" />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                disabled={localLoading || loading}
                className="flex-1 h-2 bg-dark-card rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #1a1a1a ${volume}%, #1a1a1a 100%)`
                }}
              />
              <button
                onClick={() => handleVolumeChange(volume + 5)}
                disabled={localLoading || loading || volume >= 100}
                className="p-1 rounded bg-dark-card hover:bg-dark-cardHover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp size={12} className="text-white" />
              </button>
            </div>
          </div>

          {/* Управление медиа */}
          {hasMedia && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <button
                onClick={handlePrevious}
                disabled={localLoading || loading}
                className="p-2 sm:p-2.5 rounded-lg bg-dark-card hover:bg-dark-cardHover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                title="קודם"
              >
                <SkipBack size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handlePlayPause}
                disabled={localLoading || loading}
                className={`p-3 sm:p-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 ${
                  isPlaying 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30'
                }`}
                title={isPlaying ? 'השהה' : 'נגן'}
              >
                {isPlaying ? (
                  <Pause size={18} className="sm:w-5 sm:h-5" />
                ) : (
                  <Play size={18} className="sm:w-5 sm:h-5 ml-0.5" />
                )}
              </button>
              <button
                onClick={handleNext}
                disabled={localLoading || loading}
                className="p-2 sm:p-2.5 rounded-lg bg-dark-card hover:bg-dark-cardHover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                title="הבא"
              >
                <SkipForward size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* Источники */}
          {availableSources.length > 0 && (
            <div className="mb-2 sm:mb-3">
              <div className="text-[10px] sm:text-xs text-dark-textSecondary mb-1.5">מקור</div>
              <div className="flex flex-wrap gap-1.5">
                {availableSources.slice(0, 6).map((src) => (
                  <button
                    key={src}
                    onClick={() => handleSourceSelect(src)}
                    disabled={localLoading || loading}
                    className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs transition-all truncate disabled:opacity-50 disabled:cursor-not-allowed ${
                      source === src
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-card hover:bg-dark-cardHover text-dark-textSecondary'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
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
              <div className="mt-2 space-y-2 pt-2 border-t border-dark-border">
                {/* Bass, Treble, Center, Surround - если доступны */}
                {entity.attributes.bass_level !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-dark-textSecondary">Bass</span>
                      <span className="text-[10px] font-medium text-white">{entity.attributes.bass_level}</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={entity.attributes.bass_level}
                      onChange={async (e) => {
                        const value = parseInt(e.target.value)
                        if (!api || !boseConfig.entityId) return
                        setLocalLoading(true)
                        onLoadingChange(true)
                        try {
                          await api.callService({
                            domain: 'media_player',
                            service: 'volume_set',
                            target: { entity_id: boseConfig.entityId },
                            service_data: { bass_level: value }
                          })
                        } catch (error) {
                          console.error('Ошибка изменения bass:', error)
                        } finally {
                          setLocalLoading(false)
                          onLoadingChange(false)
                        }
                      }}
                      disabled={localLoading || loading}
                      className="w-full h-1.5 bg-dark-card rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                    />
                  </div>
                )}
                
                {entity.attributes.treble_level !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-dark-textSecondary">Treble</span>
                      <span className="text-[10px] font-medium text-white">{entity.attributes.treble_level}</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={entity.attributes.treble_level}
                      onChange={async (e) => {
                        const value = parseInt(e.target.value)
                        if (!api || !boseConfig.entityId) return
                        setLocalLoading(true)
                        onLoadingChange(true)
                        try {
                          await api.callService({
                            domain: 'media_player',
                            service: 'volume_set',
                            target: { entity_id: boseConfig.entityId },
                            service_data: { treble_level: value }
                          })
                        } catch (error) {
                          console.error('Ошибка изменения treble:', error)
                        } finally {
                          setLocalLoading(false)
                          onLoadingChange(false)
                        }
                      }}
                      disabled={localLoading || loading}
                      className="w-full h-1.5 bg-dark-card rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const BoseWidget = () => {
  const [boseConfigs, setBoseConfigs] = useState<BoseConfig[]>([])
  const { api } = useHomeAssistant()
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfig = () => {
      try {
        const config = getBoseConfigsSync()
        setBoseConfigs(Array.isArray(config) ? config : [])
      } catch (error) {
        console.error('Ошибка загрузки конфигурации Bose:', error)
        setBoseConfigs([])
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
    if (api && boseConfigs.length > 0) {
      loadEntities()
      const interval = setInterval(loadEntities, 5000)
      return () => clearInterval(interval)
    }
  }, [api, boseConfigs])

  const loadEntities = async () => {
    if (!api || boseConfigs.length === 0) return

    try {
      const entityIds = boseConfigs
        .map(bose => bose.entityId)
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
      console.error('Ошибка загрузки состояний Bose:', error)
    }
  }

  if (boseConfigs.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">Bose לא מוגדר</div>
          <div className="text-xs text-dark-textSecondary">הגדר בהגדרות ← הגדרת ווידג'טים</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-2 sm:p-3 md:p-4 overflow-y-auto">
      <div className={`grid gap-3 sm:gap-4 ${
        boseConfigs.length === 1 
          ? 'grid-cols-1' 
          : boseConfigs.length === 2 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {Array.isArray(boseConfigs) && boseConfigs.map((boseConfig, index) => (
          <BoseUnit
            key={boseConfig.entityId || index}
            boseConfig={boseConfig}
            entity={boseConfig.entityId ? entities.get(boseConfig.entityId) || null : null}
            api={api}
            loading={loading}
            onLoadingChange={setLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default BoseWidget

