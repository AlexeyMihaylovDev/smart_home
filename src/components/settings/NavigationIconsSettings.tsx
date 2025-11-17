import React, { useState, useEffect } from 'react'
import { GripVertical, Home, Globe, Camera, Sparkles, Plus, X, Settings, Save, Check, Pencil, Check as CheckIcon, X as XIcon } from 'lucide-react'
import { NavigationIcon, getNavigationIconsSync, getNavigationIcons, updateNavigationIcons, isWidgetEnabledSync } from '../../services/widgetConfig'
import ToggleSwitch from '../ui/ToggleSwitch'
import { WidgetOption } from './WidgetSelector'

interface NavigationIconsSettingsProps {
  onIconsChange?: () => void
  widgetOptions?: WidgetOption[]
}

const NavigationIconsSettings = ({ onIconsChange, widgetOptions = [] }: NavigationIconsSettingsProps) => {
  const [navigationIcons, setNavigationIcons] = useState<NavigationIcon[]>(() => {
    try {
      return getNavigationIconsSync()
    } catch {
      return []
    }
  })
  const [draggedIcon, setDraggedIcon] = useState<string | null>(null)
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [expandedDashboard, setExpandedDashboard] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [editingIconId, setEditingIconId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string>('')

  // Загружаем navigation icons с сервера при монтировании
  useEffect(() => {
    const loadIconsFromServer = async () => {
      try {
        console.log('[NavigationIconsSettings] Загрузка navigation icons с сервера при монтировании...')
        await getNavigationIcons()
        console.log('[NavigationIconsSettings] Navigation icons загружены с сервера, обновляем локальное состояние')
        // После загрузки обновляем локальное состояние
        const newIcons = getNavigationIconsSync()
        setNavigationIcons(newIcons)
      } catch (error) {
        console.error('[NavigationIconsSettings] Ошибка загрузки navigation icons с сервера:', error)
        // В случае ошибки все равно загружаем из кэша/localStorage
        try {
          const newIcons = getNavigationIconsSync()
          setNavigationIcons(newIcons)
        } catch (e) {
          console.error('[NavigationIconsSettings] Ошибка загрузки из кэша:', e)
        }
      }
    }
    loadIconsFromServer()
  }, []) // Загружаем только один раз при монтировании

  useEffect(() => {
    const handleIconsChange = () => {
      try {
        const newIcons = getNavigationIconsSync()
        setNavigationIcons(newIcons)
        // Если данные изменились извне, сбрасываем флаг изменений
        setHasChanges(false)
        setIsSaved(false)
      } catch (error) {
        console.error('Ошибка обновления навигационных иконок:', error)
      }
    }
    window.addEventListener('navigation-icons-changed', handleIconsChange)
    return () => {
      window.removeEventListener('navigation-icons-changed', handleIconsChange)
    }
  }, [])

  const iconMap: Record<string, React.ComponentType<any>> = {
    camera: Camera,
    home: Home,
    network: Globe,
    vacuum: Sparkles,
  }

  // Получаем включенные виджеты, которые еще не добавлены в навигацию
  const enabledWidgets = widgetOptions.filter(widget => {
    const widgetId = widget.id || ''
    const isEnabled = isWidgetEnabledSync(widgetId)
    const isAlreadyAdded = navigationIcons.some(icon => icon.widgetId === widgetId)
    return isEnabled && !isAlreadyAdded
  })

  const handleAddWidget = (widget: WidgetOption) => {
    const widgetId = widget.id || ''
    const dashboardId = `widget-${widgetId}-${Date.now()}`
    const newIcon: NavigationIcon = {
      id: dashboardId,
      label: widget.name,
      iconName: 'widget',
      enabled: true,
      order: navigationIcons.length,
      widgetId: widgetId,
      widgetType: widgetId,
      dashboardId: dashboardId,
      widgets: []
    }
    const updatedIcons = [...navigationIcons, newIcon]
    setNavigationIcons(updatedIcons)
    setHasChanges(true)
    setIsSaved(false)
    setShowAddWidget(false)
  }
  
  const handleUpdateDashboardWidgets = (iconId: string, widgets: string[]) => {
    const updatedIcons = navigationIcons.map(icon =>
      icon.id === iconId ? { ...icon, widgets } : icon
    )
    // Обновляем состояние локально, но не сохраняем автоматически
    setNavigationIcons(updatedIcons)
    setHasChanges(true)
    setIsSaved(false)
  }
  
  const handleSave = async () => {
    if (!hasChanges) return
    
    setIsSaving(true)
    try {
      await updateNavigationIcons(navigationIcons)
      window.dispatchEvent(new Event('navigation-icons-changed'))
      setHasChanges(false)
      setIsSaved(true)
      onIconsChange?.()
      
      // Скрываем сообщение об успешном сохранении через 2 секунды
      setTimeout(() => {
        setIsSaved(false)
      }, 2000)
    } catch (error) {
      console.error('Ошибка сохранения навигационных иконок:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveIcon = (iconId: string) => {
    const updatedIcons = navigationIcons.filter(icon => icon.id !== iconId)
      .map((icon, idx) => ({ ...icon, order: idx }))
    setNavigationIcons(updatedIcons)
    setHasChanges(true)
    setIsSaved(false)
  }

  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Группировка навигационных иконок</h2>
        <div className="flex items-center gap-2">
          {isSaved && (
            <div className="flex items-center gap-1.5 text-green-400 text-sm">
              <Check size={16} />
              <span>נשמר</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isSaving || !hasChanges
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save size={16} />
            <span>{isSaving ? 'שומר...' : 'שמור'}</span>
          </button>
        </div>
      </div>
      <p className="text-sm text-dark-textSecondary mb-6">
        Перетащите иконки для изменения порядка. Включите/выключите иконки для отображения в навигации.
      </p>
      <div className="space-y-2">
        {navigationIcons
          .sort((a, b) => a.order - b.order)
          .map((icon) => {
            // Для виджетов используем иконку из widgetOptions
            let IconComponent = iconMap[icon.iconName] || Home
            if (icon.iconName === 'widget' && icon.widgetId) {
              const widget = widgetOptions.find(w => w.id === icon.widgetId)
              if (widget) {
                IconComponent = widget.icon
              }
            }
            
            return (
              <React.Fragment key={icon.id}>
                <div
                  draggable
                  onDragStart={(e) => {
                    setDraggedIcon(icon.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedIcon && draggedIcon !== icon.id) {
                      const draggedIndex = navigationIcons.findIndex(i => i.id === draggedIcon)
                      const targetIndex = navigationIcons.findIndex(i => i.id === icon.id)
                      const newIcons = [...navigationIcons]
                      const [removed] = newIcons.splice(draggedIndex, 1)
                      newIcons.splice(targetIndex, 0, removed)
                    const updatedIcons = newIcons.map((ic, idx) => ({ ...ic, order: idx }))
                    setNavigationIcons(updatedIcons)
                    setHasChanges(true)
                    setIsSaved(false)
                    setDraggedIcon(null)
                    }
                  }}
                  onDragEnd={() => setDraggedIcon(null)}
                  className={`flex items-center gap-3 p-3 bg-dark-bg border border-dark-border rounded-lg transition-all ${
                    draggedIcon === icon.id ? 'opacity-50' : 'hover:border-blue-500'
                  }`}
                >
                  <GripVertical size={20} className="text-dark-textSecondary cursor-move" />
                  <IconComponent size={20} className="text-dark-textSecondary" />
                  {editingIconId === icon.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const updatedIcons = navigationIcons.map(i =>
                              i.id === icon.id ? { ...i, label: editingLabel } : i
                            )
                            setNavigationIcons(updatedIcons)
                            setHasChanges(true)
                            setIsSaved(false)
                            setEditingIconId(null)
                            setEditingLabel('')
                          } else if (e.key === 'Escape') {
                            setEditingIconId(null)
                            setEditingLabel('')
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-dark-bg border border-blue-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const updatedIcons = navigationIcons.map(i =>
                            i.id === icon.id ? { ...i, label: editingLabel } : i
                          )
                          setNavigationIcons(updatedIcons)
                          setHasChanges(true)
                          setIsSaved(false)
                          setEditingIconId(null)
                          setEditingLabel('')
                        }}
                        className="p-1 rounded hover:bg-green-600 text-green-400 hover:text-white transition-colors"
                        title="שמור"
                      >
                        <CheckIcon size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingIconId(null)
                          setEditingLabel('')
                        }}
                        className="p-1 rounded hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                        title="בטל"
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="flex-1 text-sm font-medium">{icon.label}</span>
                  )}
                  <div className="flex items-center gap-2">
                    {!editingIconId && (
                      <button
                        onClick={() => {
                          setEditingIconId(icon.id)
                          setEditingLabel(icon.label)
                        }}
                        className="p-1 rounded hover:bg-dark-cardHover text-dark-textSecondary hover:text-white transition-colors"
                        title="ערוך שם"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedDashboard(expandedDashboard === icon.id ? null : icon.id)}
                      className="p-1 rounded hover:bg-dark-cardHover text-dark-textSecondary hover:text-white transition-colors"
                      title="ניהול וידג'טים"
                    >
                      <Settings size={16} />
                    </button>
                    {icon.iconName === 'widget' && (
                      <button
                        onClick={() => handleRemoveIcon(icon.id)}
                        className="p-1 rounded hover:bg-dark-cardHover text-dark-textSecondary hover:text-red-400 transition-colors"
                        title="הסר"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <ToggleSwitch
                      checked={icon.enabled}
                      onChange={async () => {
                      const updatedIcons = navigationIcons.map(i =>
                        i.id === icon.id ? { ...i, enabled: !i.enabled } : i
                      )
                      setNavigationIcons(updatedIcons)
                      setHasChanges(true)
                      setIsSaved(false)
                      }}
                    />
                  </div>
                </div>
                {/* Панель управления виджетами для dashboard */}
                {expandedDashboard === icon.id && (
                  <div className="mt-2 p-4 bg-dark-bg border border-dark-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-white">וידג'טים ב-{icon.label}</div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const enabledWidgets = widgetOptions.filter(w => isWidgetEnabledSync(w.id || ''))
                          const selectedWidgets = icon.widgets || []
                          const allSelected = enabledWidgets.length > 0 && enabledWidgets.every(w => selectedWidgets.includes(w.id || ''))
                          
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const enabledWidgetIds = enabledWidgets.map(w => w.id || '').filter(Boolean)
                                const newWidgets = allSelected ? [] : enabledWidgetIds
                                handleUpdateDashboardWidgets(icon.id, newWidgets)
                              }}
                              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            >
                              {allSelected ? 'הסר הכל' : 'בחר הכל'}
                            </button>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {widgetOptions
                        .filter(w => isWidgetEnabledSync(w.id || ''))
                        .map((widget) => {
                          const widgetId = widget.id || ''
                          const isSelected = icon.widgets?.includes(widgetId) || false
                          const WidgetIcon = widget.icon
                          
                          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.stopPropagation()
                            const currentWidgets = icon.widgets || []
                            const newWidgets = e.target.checked
                              ? [...currentWidgets, widgetId]
                              : currentWidgets.filter((id: string) => id !== widgetId)
                            handleUpdateDashboardWidgets(icon.id, newWidgets)
                          }
                          
                          return (
                            <div
                              key={widgetId}
                              className="flex items-center gap-3 p-2 bg-dark-card hover:bg-dark-cardHover border border-dark-border rounded-lg transition-all cursor-pointer"
                              onClick={(e) => {
                                // Если клик был не на input, переключаем checkbox программно
                                const target = e.target as HTMLElement
                                if (target.tagName !== 'INPUT' && !target.closest('input')) {
                                  e.preventDefault()
                                  const currentWidgets = icon.widgets || []
                                  const newWidgets = isSelected
                                    ? currentWidgets.filter((id: string) => id !== widgetId)
                                    : [...currentWidgets, widgetId]
                                  handleUpdateDashboardWidgets(icon.id, newWidgets)
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={handleInputChange}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
                              />
                              <div className={`${widget.color} p-1.5 rounded-lg flex-shrink-0`}>
                                <WidgetIcon size={16} className="text-white" />
                              </div>
                              <span className="flex-1 text-sm text-white">{widget.name}</span>
                            </div>
                          )
                        })}
                      {widgetOptions.filter(w => isWidgetEnabledSync(w.id || '')).length === 0 && (
                        <div className="text-sm text-dark-textSecondary text-center py-4">
                          אין וידג'טים מופעלים
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        
        {/* Кнопка добавления виджета */}
        {enabledWidgets.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddWidget(!showAddWidget)}
              className="w-full flex items-center gap-3 p-3 bg-dark-bg border-2 border-dashed border-dark-border rounded-lg transition-all hover:border-blue-500 text-dark-textSecondary hover:text-white"
            >
              <Plus size={20} />
              <span className="flex-1 text-sm font-medium text-left">הוסף וידג'ט לניווט</span>
            </button>
            
            {showAddWidget && (
              <div className="mt-2 p-3 bg-dark-card border border-dark-border rounded-lg space-y-2 max-h-64 overflow-y-auto">
                {enabledWidgets.map((widget) => {
                  const WidgetIcon = widget.icon
                  return (
                    <button
                      key={widget.id}
                      onClick={() => handleAddWidget(widget)}
                      className="w-full flex items-center gap-3 p-2 bg-dark-bg hover:bg-dark-cardHover border border-dark-border rounded-lg transition-all text-left"
                    >
                      <div className={`${widget.color} p-2 rounded-lg`}>
                        <WidgetIcon size={16} className="text-white" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-white">{widget.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NavigationIconsSettings

