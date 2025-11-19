import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { getTVPreviewConfigsSync, TVPreviewConfig } from '../../services/widgetConfig'
import { 
  Power, Volume2, VolumeX, Volume1, Play, Pause, SkipForward, SkipBack,
  Tv, Radio, Settings, ChevronDown, ChevronUp, Monitor, MonitorSpeaker
} from 'lucide-react'

interface TVUnitProps {
  tvConfig: TVPreviewConfig
  entity: Entity | null
  api: any
  loading: boolean
  onLoadingChange: (loading: boolean) => void
}

const TVUnit = ({ tvConfig, entity, api, loading, onLoadingChange }: TVUnitProps) => {
  const [localLoading, setLocalLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [volume, setVolume] = useState<number>(0)
  const [isMuted, setIsMuted] = useState(false)

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
      setIsMuted(entity.attributes.is_volume_muted === true)
    }
  }, [entity])

  const isOn = entity?.state === 'on' || entity?.state === 'playing'
  const isPlaying = entity?.state === 'playing'
  const isPaused = entity?.state === 'paused'
  const isOff = entity?.state === 'off' || entity?.state === 'unavailable'
  
  const mediaTitle = entity?.attributes.media_title || ''
  const mediaArtist = entity?.attributes.media_artist || ''
  const mediaImage = entity?.attributes.entity_picture || ''
  const source = entity?.attributes.source || ''
  const appName = entity?.attributes.app_name || ''
  const mediaContentType = entity?.attributes.media_content_type || ''
  
  const friendlyName = tvConfig.name || entity?.attributes.friendly_name || tvConfig.entityId || 'TV'

  const handlePower = async () => {
    if (!api || !tvConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      if (isOn) {
        await api.turnOff(tvConfig.entityId)
      } else {
        await api.turnOn(tvConfig.entityId)
      }
    } catch (error) {
      console.error('Ошибка управления питанием:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleVolumeChange = async (newVolume: number) => {
    if (!api || !tvConfig.entityId) return

    const clampedVolume = Math.max(0, Math.min(100, newVolume))
    setVolume(clampedVolume)

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.setVolume(tvConfig.entityId, clampedVolume)
      if (isMuted && clampedVolume > 0) {
        setIsMuted(false)
      }
    } catch (error) {
      console.error('Ошибка изменения громкости:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleMute = async () => {
    if (!api || !tvConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'media_player',
        service: 'volume_mute',
        target: { entity_id: tvConfig.entityId },
        service_data: { is_volume_muted: !isMuted }
      })
      setIsMuted(!isMuted)
    } catch (error) {
      console.error('Ошибка mute/unmute:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handlePlayPause = async () => {
    if (!api || !tvConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.mediaPlayPause(tvConfig.entityId)
    } catch (error) {
      console.error('Ошибка play/pause:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleNext = async () => {
    if (!api || !tvConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.mediaNext(tvConfig.entityId)
    } catch (error) {
      console.error('Ошибка next track:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handlePrevious = async () => {
    if (!api || !tvConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.mediaPrevious(tvConfig.entityId)
    } catch (error) {
      console.error('Ошибка previous track:', error)
    } finally {
      setLocalLoading(false)
      onLoadingChange(false)
    }
  }

  const handleSourceSelect = async (sourceName: string) => {
    if (!api || !tvConfig.entityId) return

    setLocalLoading(true)
    onLoadingChange(true)
    try {
      await api.callService({
        domain: 'media_player',
        service: 'select_source',
        target: { entity_id: tvConfig.entityId },
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
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">{friendlyName}</div>
          <div className="text-xs text-dark-textSecondary">לא מחובר</div>
        </div>
      </div>
    )
  }


  return (
    <div className="h-full p-2 sm:p-3 md:p-4 flex flex-col">
      {/* Дизайн телевизора с рамкой */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg border-4 border-gray-700 shadow-2xl overflow-hidden relative">
        {/* Верхняя часть телевизора (рамка) */}
        <div className="h-2 sm:h-3 bg-gray-800 border-b border-gray-600"></div>
        
        {/* Экран телевизора */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {isOn ? (
            <>
              {/* Изображение или градиент */}
              {mediaImage ? (
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${mediaImage})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center">
                  <div className="text-center p-4">
                    {mediaTitle && (
                      <div className="text-white text-lg sm:text-xl font-bold mb-2">{mediaTitle}</div>
                    )}
                    {mediaArtist && (
                      <div className="text-white/80 text-sm sm:text-base">{mediaArtist}</div>
                    )}
                    {!mediaTitle && !mediaArtist && (
                      <Tv size={48} className="text-white/30 mx-auto" />
                    )}
                  </div>
                </div>
              )}
              
              {/* Информация о медиа */}
              {(mediaTitle || source || appName) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 sm:p-4">
                  {mediaTitle && (
                    <div className="text-white text-sm sm:text-base font-semibold truncate mb-1">
                      {mediaTitle}
                    </div>
                  )}
                  {mediaArtist && (
                    <div className="text-white/70 text-xs sm:text-sm truncate mb-1">
                      {mediaArtist}
                    </div>
                  )}
                  {(source || appName) && (
                    <div className="text-white/50 text-xs truncate">
                      {source || appName}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-950">
              <div className="text-center">
                <Monitor size={48} className="text-gray-700 mx-auto mb-2" />
                <div className="text-gray-600 text-sm">כבוי</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Нижняя часть телевизора (подставка) */}
        <div className="h-1 sm:h-2 bg-gray-800 border-t border-gray-600"></div>
        <div className="h-2 sm:h-3 bg-gray-700 rounded-b-lg"></div>
      </div>

      {/* Панель управления */}
      <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
        {/* Кнопка питания */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isOn ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
              <MonitorSpeaker size={16} className={`${isOn ? 'text-blue-400' : 'text-gray-400'}`} />
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
          </div>
          <button
            onClick={handlePower}
            disabled={localLoading || loading}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
              isOn 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isOn ? 'כבה' : 'הדלק'}
          >
            <Power size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">
              {isOn ? 'כבה' : 'הדלק'}
            </span>
          </button>
        </div>

        {/* Громкость */}
        {isOn && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={handleMute}
                  disabled={localLoading || loading}
                  className="p-1.5 rounded-lg hover:bg-dark-cardHover transition-colors disabled:opacity-50"
                  title={isMuted ? 'השתק' : 'בטל השתקה'}
                >
                  {isMuted ? (
                    <VolumeX size={18} className="text-red-400" />
                  ) : volume === 0 ? (
                    <VolumeX size={18} className="text-dark-textSecondary" />
                  ) : volume < 50 ? (
                    <Volume1 size={18} className="text-blue-400" />
                  ) : (
                    <Volume2 size={18} className="text-blue-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  disabled={localLoading || loading}
                  className="flex-1 h-2 bg-dark-card rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #1a1a1a ${volume}%, #1a1a1a 100%)`
                  }}
                />
                <span className="text-xs sm:text-sm text-white font-medium w-10 sm:w-12 text-right">
                  {volume}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Медиа контролы */}
        {isOn && (isPlaying || isPaused) && (
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={handlePrevious}
              disabled={localLoading || loading}
              className="p-2 sm:p-2.5 rounded-lg bg-dark-card hover:bg-dark-cardHover transition-colors disabled:opacity-50"
              title="קודם"
            >
              <SkipBack size={18} className="text-white" />
            </button>
            <button
              onClick={handlePlayPause}
              disabled={localLoading || loading}
              className="p-2.5 sm:p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              title={isPlaying ? 'השהה' : 'נגן'}
            >
              {isPlaying ? (
                <Pause size={20} className="text-white" />
              ) : (
                <Play size={20} className="text-white" />
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={localLoading || loading}
              className="p-2 sm:p-2.5 rounded-lg bg-dark-card hover:bg-dark-cardHover transition-colors disabled:opacity-50"
              title="הבא"
            >
              <SkipForward size={18} className="text-white" />
            </button>
          </div>
        )}

        {/* Выбор источника */}
        {isOn && availableSources.length > 0 && (
          <div className="space-y-1.5 sm:space-y-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-dark-card hover:bg-dark-cardHover transition-colors"
            >
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-blue-400" />
                <span className="text-xs sm:text-sm text-white font-medium">
                  {source || 'בחר מקור'}
                </span>
              </div>
              {showAdvanced ? (
                <ChevronUp size={16} className="text-dark-textSecondary" />
              ) : (
                <ChevronDown size={16} className="text-dark-textSecondary" />
              )}
            </button>
            {showAdvanced && (
              <div className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                {availableSources.map((sourceName) => (
                  <button
                    key={sourceName}
                    onClick={() => {
                      handleSourceSelect(sourceName)
                      setShowAdvanced(false)
                    }}
                    className={`w-full text-right p-2 rounded-lg transition-colors text-xs sm:text-sm ${
                      source === sourceName
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-card hover:bg-dark-cardHover text-white'
                    }`}
                  >
                    {sourceName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Расширенная информация */}
        {isOn && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-dark-card hover:bg-dark-cardHover transition-colors"
          >
            <Settings size={14} className="text-dark-textSecondary" />
            <span className="text-xs text-dark-textSecondary">
              {showAdvanced ? 'הסתר פרטים' : 'פרטים נוספים'}
            </span>
          </button>
        )}

        {/* Расширенная информация */}
        {showAdvanced && isOn && entity && (
          <div className="p-2 sm:p-3 bg-dark-card rounded-lg border border-dark-border space-y-1.5 sm:space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-dark-textSecondary">מצב:</span>
              <span className="text-white">{entity.state}</span>
            </div>
            {mediaContentType && (
              <div className="flex justify-between">
                <span className="text-dark-textSecondary">סוג מדיה:</span>
                <span className="text-white">{mediaContentType}</span>
              </div>
            )}
            {appName && (
              <div className="flex justify-between">
                <span className="text-dark-textSecondary">אפליקציה:</span>
                <span className="text-white">{appName}</span>
              </div>
            )}
            {entity.attributes.media_duration && (
              <div className="flex justify-between">
                <span className="text-dark-textSecondary">משך:</span>
                <span className="text-white">
                  {Math.floor(entity.attributes.media_duration / 60)}:
                  {String(Math.floor(entity.attributes.media_duration % 60)).padStart(2, '0')}
                </span>
              </div>
            )}
            {entity.attributes.media_position && (
              <div className="flex justify-between">
                <span className="text-dark-textSecondary">מיקום:</span>
                <span className="text-white">
                  {Math.floor(entity.attributes.media_position / 60)}:
                  {String(Math.floor(entity.attributes.media_position % 60)).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const TVPreviewWidget = () => {
  const { api } = useHomeAssistant()
  const [tvConfigs, setTVConfigs] = useState<TVPreviewConfig[]>([])
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadConfigs = () => {
      const configs = getTVPreviewConfigsSync()
      setTVConfigs(configs)
    }

    loadConfigs()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'widget_config') {
        loadConfigs()
      }
    }

    const handleWidgetsChanged = () => {
      loadConfigs()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('widgets-changed', handleWidgetsChanged)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('widgets-changed', handleWidgetsChanged)
    }
  }, [])

  useEffect(() => {
    if (api && tvConfigs.length > 0) {
      loadEntities()
      const interval = setInterval(loadEntities, 2000)
      return () => clearInterval(interval)
    }
  }, [api, tvConfigs])

  const loadEntities = async () => {
    if (!api || tvConfigs.length === 0) return

    try {
      const entityIds = tvConfigs
        .map(tv => tv.entityId)
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
      console.error('Ошибка загрузки состояний TV:', error)
    }
  }

  if (tvConfigs.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark-textSecondary mb-2">טלוויזיות לא מוגדרות</div>
          <div className="text-xs text-dark-textSecondary">הגדר ב-Settings → הגדרת וידג'טים</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-2 sm:p-3 md:p-4 overflow-y-auto">
      <div className={`grid gap-3 sm:gap-4 ${
        tvConfigs.length === 1 
          ? 'grid-cols-1' 
          : tvConfigs.length === 2 
          ? 'grid-cols-1 md:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {tvConfigs.map((tvConfig, index) => (
          <TVUnit
            key={tvConfig.entityId || index}
            tvConfig={tvConfig}
            entity={tvConfig.entityId ? entities.get(tvConfig.entityId) || null : null}
            api={api}
            loading={loading}
            onLoadingChange={setLoading}
          />
        ))}
      </div>
    </div>
  )
}

export default TVPreviewWidget
