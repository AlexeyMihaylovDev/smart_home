import React from 'react'
import { Lightbulb, Tv, Music, Gauge, Wind, Droplet, Camera, Navigation } from 'lucide-react'
import ToggleSwitch from '../ui/ToggleSwitch'
import { isWidgetEnabledSync, setWidgetEnabled } from '../../services/widgetConfig'

export type WidgetType = 'ambient-lighting' | 'tv-time' | 'sensors' | 'cameras' | 'ac' | 'water-heater' | 'motors' | 'bose' | 'vacuum' | 'led' | 'clock' | 'tv-preview' | null

export interface WidgetOption {
  id: WidgetType
  name: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}

interface WidgetSelectorProps {
  widgetOptions: WidgetOption[]
  widgetEnabledStates: Record<string, boolean>
  onWidgetSelect: (widgetId: WidgetType) => void
  onWidgetEnabledChange: (widgetId: string, enabled: boolean) => void
}

const WidgetSelector = ({ 
  widgetOptions, 
  widgetEnabledStates, 
  onWidgetSelect, 
  onWidgetEnabledChange 
}: WidgetSelectorProps) => {
  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-6">
      <h2 className="text-xl font-bold mb-2">בחר וידג'ט להגדרה</h2>
      <p className="text-sm text-dark-textSecondary mb-6">
        בחר וידג'ט שברצונך להגדיר
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgetOptions
          .map((widget) => {
            const widgetId = widget.id || ''
            const enabled = widgetEnabledStates[widgetId] ?? isWidgetEnabledSync(widgetId)
            return { widget, enabled, widgetId }
          })
          .sort((a, b) => {
            // Сначала включенные виджеты
            if (a.enabled && !b.enabled) return -1
            if (!a.enabled && b.enabled) return 1
            // Затем сортируем по алфавиту по имени
            return a.widget.name.localeCompare(b.widget.name, 'he')
          })
          .map(({ widget, enabled, widgetId }) => {
            const Icon = widget.icon
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
                            onWidgetEnabledChange(widgetId, newState)
                            setWidgetEnabled(widgetId, newState)
                            window.dispatchEvent(new Event('widgets-changed'))
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-dark-textSecondary mb-3">{widget.description}</p>
                    <button
                      onClick={() => onWidgetSelect(widget.id)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      הגדר →
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default WidgetSelector

