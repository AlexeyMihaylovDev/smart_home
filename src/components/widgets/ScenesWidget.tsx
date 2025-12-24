import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../../context/HomeAssistantContext'
import { Entity } from '../../services/homeAssistantAPI'
import { Play, Settings, Check, AlertCircle, Sparkles } from 'lucide-react'

export type ScenesStyle = 'grid' | 'list' | 'compact' | 'cards'

interface SceneEntity extends Entity {
    entity_id: string
    state: string
    attributes: {
        friendly_name?: string
        icon?: string
        [key: string]: any
    }
}

const ScenesWidget = () => {
    const { api } = useHomeAssistant()
    const [scenes, setScenes] = useState<SceneEntity[]>([])
    const [loading, setLoading] = useState(true)
    const [activatingScene, setActivatingScene] = useState<string | null>(null)
    const [lastActivated, setLastActivated] = useState<string | null>(null)
    const [style, _setStyle] = useState<ScenesStyle>('grid')
    const [error, setError] = useState<string | null>(null)

    // Загрузка всех сцен из Home Assistant
    useEffect(() => {
        const loadScenes = async () => {
            if (!api) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)
                const states = await api.getStates()

                // Фильтруем только scene entities
                const sceneEntities = states
                    .filter(entity => entity.entity_id.startsWith('scene.'))
                    .sort((a, b) => {
                        const nameA = a.attributes.friendly_name || a.entity_id
                        const nameB = b.attributes.friendly_name || b.entity_id
                        return nameA.localeCompare(nameB)
                    }) as SceneEntity[]

                console.log('[ScenesWidget] Loaded scenes:', sceneEntities.length)
                setScenes(sceneEntities)
            } catch (err) {
                console.error('[ScenesWidget] Error loading scenes:', err)
                setError('Ошибка загрузки сцен')
            } finally {
                setLoading(false)
            }
        }

        loadScenes()

        // Обновляем каждые 30 секунд (сцены меняются редко)
        const interval = setInterval(loadScenes, 30000)
        return () => clearInterval(interval)
    }, [api])

    // Активация сцены
    const activateScene = async (sceneId: string) => {
        if (!api || activatingScene) return

        try {
            setActivatingScene(sceneId)

            await api.callService({
                domain: 'scene',
                service: 'turn_on',
                target: { entity_id: sceneId }
            })

            setLastActivated(sceneId)

            // Сбрасываем индикатор через 2 секунды
            setTimeout(() => {
                setLastActivated(null)
            }, 2000)
        } catch (err) {
            console.error('[ScenesWidget] Error activating scene:', err)
        } finally {
            setActivatingScene(null)
        }
    }

    // Получение иконки для сцены
    const getSceneIcon = (scene: SceneEntity) => {
        const iconName = scene.attributes.icon

        // Можно добавить маппинг mdi иконок если нужно
        if (iconName?.includes('night')) return '🌙'
        if (iconName?.includes('movie')) return '🎬'
        if (iconName?.includes('party')) return '🎉'
        if (iconName?.includes('romantic')) return '💕'
        if (iconName?.includes('work')) return '💼'
        if (iconName?.includes('relax')) return '😌'
        if (iconName?.includes('morning')) return '🌅'
        if (iconName?.includes('evening')) return '🌆'

        return null
    }

    if (loading) {
        return (
            <div className="p-4 bg-dark-card rounded-xl border border-dark-border h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        )
    }

    if (!api) {
        return (
            <div className="p-4 bg-dark-card rounded-xl border border-dark-border h-full">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-purple-400" size={20} />
                    <h3 className="text-lg font-medium">סצנות</h3>
                </div>
                <div className="flex flex-col items-center justify-center text-dark-textSecondary py-8">
                    <AlertCircle size={32} className="mb-2 text-yellow-500" />
                    <p className="text-sm text-center">לא מחובר ל-Home Assistant</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-dark-card rounded-xl border border-dark-border h-full">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-purple-400" size={20} />
                    <h3 className="text-lg font-medium">סצנות</h3>
                </div>
                <div className="flex flex-col items-center justify-center text-red-400 py-8">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="text-sm text-center">{error}</p>
                </div>
            </div>
        )
    }

    if (scenes.length === 0) {
        return (
            <div className="p-4 bg-dark-card rounded-xl border border-dark-border h-full">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-purple-400" size={20} />
                    <h3 className="text-lg font-medium">סצנות</h3>
                </div>
                <div className="flex flex-col items-center justify-center text-dark-textSecondary py-8">
                    <Settings size={32} className="mb-2" />
                    <p className="text-sm text-center">לא נמצאו סצנות ב-Home Assistant</p>
                    <p className="text-xs text-center mt-1 opacity-60">הוסף סצנות ב-Home Assistant כדי להציג אותן כאן</p>
                </div>
            </div>
        )
    }

    // Grid Style (default)
    if (style === 'grid') {
        return (
            <div className="p-4 bg-dark-card rounded-xl border border-dark-border h-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={20} />
                        <h3 className="text-lg font-medium">סצנות</h3>
                        <span className="text-xs text-dark-textSecondary bg-dark-bg px-2 py-0.5 rounded-full">
                            {scenes.length}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
                    {scenes.map(scene => {
                        const isActivating = activatingScene === scene.entity_id
                        const wasActivated = lastActivated === scene.entity_id
                        const icon = getSceneIcon(scene)
                        const name = scene.attributes.friendly_name || scene.entity_id.replace('scene.', '').replace(/_/g, ' ')

                        return (
                            <button
                                key={scene.entity_id}
                                onClick={() => activateScene(scene.entity_id)}
                                disabled={isActivating}
                                className={`
                  relative p-4 rounded-xl border transition-all duration-200
                  flex items-center gap-3 text-left
                  ${wasActivated
                                        ? 'bg-green-600/20 border-green-500/50 text-green-300'
                                        : 'bg-dark-cardHover border-dark-border hover:border-purple-500/50 hover:bg-purple-900/20'
                                    }
                  ${isActivating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
                `}
                            >
                                {/* Icon */}
                                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-xl
                  ${wasActivated ? 'bg-green-500/30' : 'bg-purple-500/20'}
                `}>
                                    {wasActivated ? (
                                        <Check size={20} className="text-green-400" />
                                    ) : icon ? (
                                        <span>{icon}</span>
                                    ) : (
                                        <Play size={18} className="text-purple-400" />
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate capitalize">{name}</p>
                                    <p className="text-xs text-dark-textSecondary truncate">
                                        {scene.entity_id}
                                    </p>
                                </div>

                                {/* Loading indicator */}
                                {isActivating && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-dark-card/50 rounded-xl">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500" />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // List Style
    if (style === 'list') {
        return (
            <div className="p-4 bg-dark-card rounded-xl border border-dark-border h-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-purple-400" size={20} />
                        <h3 className="text-lg font-medium">סצנות</h3>
                        <span className="text-xs text-dark-textSecondary bg-dark-bg px-2 py-0.5 rounded-full">
                            {scenes.length}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {scenes.map(scene => {
                        const isActivating = activatingScene === scene.entity_id
                        const wasActivated = lastActivated === scene.entity_id
                        const icon = getSceneIcon(scene)
                        const name = scene.attributes.friendly_name || scene.entity_id.replace('scene.', '').replace(/_/g, ' ')

                        return (
                            <button
                                key={scene.entity_id}
                                onClick={() => activateScene(scene.entity_id)}
                                disabled={isActivating}
                                className={`
                  w-full p-3 rounded-lg border transition-all duration-200
                  flex items-center gap-3 text-left
                  ${wasActivated
                                        ? 'bg-green-600/20 border-green-500/50'
                                        : 'bg-dark-bg border-dark-border hover:border-purple-500/50 hover:bg-purple-900/10'
                                    }
                `}
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/20">
                                    {wasActivated ? (
                                        <Check size={16} className="text-green-400" />
                                    ) : icon ? (
                                        <span className="text-sm">{icon}</span>
                                    ) : (
                                        <Play size={14} className="text-purple-400" />
                                    )}
                                </div>
                                <span className="flex-1 font-medium truncate capitalize">{name}</span>
                                {isActivating && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Compact Style
    return (
        <div className="p-4 bg-dark-card rounded-xl border border-dark-border h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-purple-400" size={18} />
                    <h3 className="text-base font-medium">סצנות</h3>
                </div>
                <span className="text-xs text-dark-textSecondary">{scenes.length}</span>
            </div>

            <div className="flex flex-wrap gap-2 overflow-y-auto flex-1">
                {scenes.map(scene => {
                    const isActivating = activatingScene === scene.entity_id
                    const wasActivated = lastActivated === scene.entity_id
                    const icon = getSceneIcon(scene)
                    const name = scene.attributes.friendly_name || scene.entity_id.replace('scene.', '').replace(/_/g, ' ')

                    return (
                        <button
                            key={scene.entity_id}
                            onClick={() => activateScene(scene.entity_id)}
                            disabled={isActivating}
                            className={`
                px-3 py-2 rounded-lg border transition-all duration-200
                flex items-center gap-2 text-sm
                ${wasActivated
                                    ? 'bg-green-600/20 border-green-500/50 text-green-300'
                                    : 'bg-dark-bg border-dark-border hover:border-purple-500/50 hover:bg-purple-900/10'
                                }
              `}
                        >
                            {wasActivated ? (
                                <Check size={14} className="text-green-400" />
                            ) : icon ? (
                                <span className="text-sm">{icon}</span>
                            ) : (
                                <Play size={12} className="text-purple-400" />
                            )}
                            <span className="capitalize truncate max-w-24">{name}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default ScenesWidget
