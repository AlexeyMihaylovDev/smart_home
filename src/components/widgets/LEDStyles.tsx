import { Power, Lightbulb, Palette, Sun } from 'lucide-react'

export interface PreparedLED {
  id: string
  name: string
  type: 'rgb' | 'dimmer'
  isOn: boolean
  brightness: number
  rgbColor: { r: number; g: number; b: number }
  hasEntity: boolean
  controlsDisabled?: boolean
}

interface LEDStyleProps {
  leds: PreparedLED[]
  onPowerToggle?: (led: PreparedLED) => void
  onBrightnessChange?: (led: PreparedLED, brightness: number) => void
  onBrightnessMouseDown?: (led: PreparedLED) => void
  onBrightnessMouseUp?: (led: PreparedLED) => void
  onColorChange?: (led: PreparedLED, color: { r: number; g: number; b: number }) => void
}

// Стиль 1: Список (по умолчанию)
export const LEDListStyle = ({ leds, onPowerToggle, onBrightnessChange, onBrightnessMouseDown, onBrightnessMouseUp, onColorChange }: LEDStyleProps) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {leds.map((led) => (
        <div key={led.id} className="p-3 sm:p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-blue-500/50 transition-all">
          {/* Заголовок с питанием */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`p-2 rounded-lg flex-shrink-0 ${led.isOn ? 'bg-yellow-500/20' : 'bg-gray-500/20'}`}>
                <Lightbulb size={18} className={`${led.isOn ? 'text-yellow-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base text-white truncate" title={led.name}>
                  {led.name}
                </div>
                <div className="text-[10px] sm:text-xs text-dark-textSecondary">
                  {led.type === 'rgb' ? 'RGB' : 'Dimmer'}
                </div>
              </div>
            </div>
            {!led.controlsDisabled && onPowerToggle && (
              <button
                onClick={() => onPowerToggle(led)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  led.isOn 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
                title={led.isOn ? 'כבה' : 'הדלק'}
              >
                <Power size={16} />
              </button>
            )}
          </div>

          {led.isOn && (
            <div className="space-y-3 sm:space-y-4">
              {/* Ползунок яркости */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-yellow-400" />
                    <span className="text-xs sm:text-sm text-white font-medium">בהירות</span>
                  </div>
                  <span className="text-xs sm:text-sm text-white font-medium w-12 text-right">
                    {led.brightness}%
                  </span>
                </div>
                {!led.controlsDisabled && onBrightnessChange ? (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={led.brightness}
                    onChange={(e) => onBrightnessChange(led, Number(e.target.value))}
                    onMouseDown={() => onBrightnessMouseDown?.(led)}
                    onMouseUp={() => onBrightnessMouseUp?.(led)}
                    onTouchStart={() => onBrightnessMouseDown?.(led)}
                    onTouchEnd={() => onBrightnessMouseUp?.(led)}
                    className="w-full h-3 bg-dark-card rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed slider-brightness"
                    style={{
                      background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${led.brightness}%, #1a1a1a ${led.brightness}%, #1a1a1a 100%)`
                    }}
                  />
                ) : (
                  <div className="w-full h-3 bg-dark-card rounded-lg relative">
                    <div 
                      className="h-full bg-yellow-500 rounded-lg"
                      style={{ width: `${led.brightness}%` }}
                    />
                  </div>
                )}
              </div>

              {/* RGB Color для RGB ламп */}
              {led.type === 'rgb' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette size={16} className="text-blue-400" />
                    <span className="text-xs sm:text-sm text-white font-medium">צבע</span>
                  </div>
                  <div 
                    className="w-full h-12 rounded-lg border-2 border-dark-border"
                    style={{ backgroundColor: `rgb(${led.rgbColor.r}, ${led.rgbColor.g}, ${led.rgbColor.b})` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Стиль 2: Карточки
export const LEDCardStyle = ({ leds, onPowerToggle, onBrightnessChange, onBrightnessMouseDown, onBrightnessMouseUp, onColorChange }: LEDStyleProps) => {
  return (
    <div className={`grid gap-3 sm:gap-4 ${
      leds.length === 1 
        ? 'grid-cols-1' 
        : leds.length === 2 
        ? 'grid-cols-1 md:grid-cols-2' 
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }`}>
      {leds.map((led) => (
        <div 
          key={led.id} 
          className={`p-4 bg-dark-bg rounded-lg border transition-all ${
            led.isOn ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-dark-border'
          }`}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${led.isOn ? 'bg-yellow-500/20' : 'bg-gray-500/20'}`}>
                <Lightbulb size={20} className={led.isOn ? 'text-yellow-400' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-white truncate" title={led.name}>
                  {led.name}
                </div>
                <div className="text-xs text-dark-textSecondary">
                  {led.type === 'rgb' ? 'RGB' : 'Dimmer'}
                </div>
              </div>
            </div>
            {!led.controlsDisabled && onPowerToggle && (
              <button
                onClick={() => onPowerToggle(led)}
                className={`p-2 rounded-lg transition-all ${
                  led.isOn 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <Power size={16} />
              </button>
            )}
          </div>

          {led.isOn && (
            <div className="space-y-3">
              {/* Ползунок яркости */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Sun size={14} className="text-yellow-400" />
                  <span className="text-xs text-white font-medium">{led.brightness}%</span>
                </div>
                {!led.controlsDisabled && onBrightnessChange ? (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={led.brightness}
                    onChange={(e) => onBrightnessChange(led, Number(e.target.value))}
                    onMouseDown={() => onBrightnessMouseDown?.(led)}
                    onMouseUp={() => onBrightnessMouseUp?.(led)}
                    onTouchStart={() => onBrightnessMouseDown?.(led)}
                    onTouchEnd={() => onBrightnessMouseUp?.(led)}
                    className="w-full h-2 bg-dark-card rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed slider-brightness"
                    style={{
                      background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${led.brightness}%, #1a1a1a ${led.brightness}%, #1a1a1a 100%)`
                    }}
                  />
                ) : (
                  <div className="w-full h-2 bg-dark-card rounded-lg relative">
                    <div 
                      className="h-full bg-yellow-500 rounded-lg"
                      style={{ width: `${led.brightness}%` }}
                    />
                  </div>
                )}
              </div>

              {/* RGB Color */}
              {led.type === 'rgb' && (
                <div 
                  className="w-full h-16 rounded-lg border-2 border-dark-border"
                  style={{ backgroundColor: `rgb(${led.rgbColor.r}, ${led.rgbColor.g}, ${led.rgbColor.b})` }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Стиль 3: Компактный
export const LEDCompactStyle = ({ leds, onPowerToggle, onBrightnessChange, onBrightnessMouseDown, onBrightnessMouseUp, onColorChange }: LEDStyleProps) => {
  return (
    <div className="space-y-2">
      {leds.map((led) => (
        <div key={led.id} className="flex items-center gap-3 p-2.5 bg-dark-bg rounded-lg border border-dark-border hover:bg-dark-card transition-colors">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${led.isOn ? 'bg-yellow-500/20' : 'bg-gray-500/20'}`}>
            <Lightbulb size={16} className={led.isOn ? 'text-yellow-400' : 'text-gray-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{led.name}</div>
            <div className="text-xs text-dark-textSecondary">
              {led.isOn ? `${led.brightness}%` : 'כבוי'}
            </div>
          </div>
          {led.isOn && led.type === 'rgb' && (
            <div 
              className="w-8 h-8 rounded border border-dark-border flex-shrink-0"
              style={{ backgroundColor: `rgb(${led.rgbColor.r}, ${led.rgbColor.g}, ${led.rgbColor.b})` }}
            />
          )}
          {!led.controlsDisabled && onPowerToggle && (
            <button
              onClick={() => onPowerToggle(led)}
              className={`p-1.5 rounded transition-all ${
                led.isOn 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <Power size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// Стиль 4: Современный (Modern)
export const LEDModernStyle = ({ leds, onPowerToggle, onBrightnessChange, onBrightnessMouseDown, onBrightnessMouseUp, onColorChange }: LEDStyleProps) => {
  return (
    <div className="space-y-4">
      {leds.map((led) => (
        <div 
          key={led.id} 
          className={`relative overflow-hidden rounded-xl border transition-all ${
            led.isOn 
              ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent' 
              : 'border-dark-border bg-dark-bg'
          }`}
        >
          {/* Фоновый градиент для RGB */}
          {led.isOn && led.type === 'rgb' && (
            <div 
              className="absolute inset-0 opacity-20"
              style={{ 
                background: `linear-gradient(135deg, rgb(${led.rgbColor.r}, ${led.rgbColor.g}, ${led.rgbColor.b}) 0%, transparent 100%)`
              }}
            />
          )}
          
          <div className="relative p-4">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${led.isOn ? 'bg-yellow-500/20 shadow-lg shadow-yellow-500/20' : 'bg-gray-500/20'}`}>
                  <Lightbulb size={24} className={led.isOn ? 'text-yellow-400' : 'text-gray-400'} />
                </div>
                <div>
                  <div className="font-semibold text-base text-white">{led.name}</div>
                  <div className="text-xs text-dark-textSecondary mt-0.5">
                    {led.type === 'rgb' ? 'RGB LED' : 'Dimmer LED'}
                  </div>
                </div>
              </div>
              {!led.controlsDisabled && onPowerToggle && (
                <button
                  onClick={() => onPowerToggle(led)}
                  className={`px-4 py-2 rounded-xl transition-all font-medium text-sm ${
                    led.isOn 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <Power size={18} className="inline mr-1" />
                  {led.isOn ? 'כבה' : 'הדלק'}
                </button>
              )}
            </div>

            {led.isOn && (
              <div className="space-y-4">
                {/* Ползунок яркости с улучшенным дизайном */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun size={18} className="text-yellow-400" />
                      <span className="text-sm font-medium text-white">בהירות</span>
                    </div>
                    <div className="px-3 py-1 bg-dark-card/50 rounded-lg">
                      <span className="text-sm font-bold text-yellow-400">{led.brightness}%</span>
                    </div>
                  </div>
                  {!led.controlsDisabled && onBrightnessChange ? (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={led.brightness}
                      onChange={(e) => onBrightnessChange(led, Number(e.target.value))}
                      onMouseDown={() => onBrightnessMouseDown?.(led)}
                      onMouseUp={() => onBrightnessMouseUp?.(led)}
                      onTouchStart={() => onBrightnessMouseDown?.(led)}
                      onTouchEnd={() => onBrightnessMouseUp?.(led)}
                      className="w-full h-4 bg-dark-card rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed slider-brightness"
                      style={{
                        background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${led.brightness}%, #1a1a1a ${led.brightness}%, #1a1a1a 100%)`
                      }}
                    />
                  ) : (
                    <div className="w-full h-4 bg-dark-card rounded-lg relative overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg"
                        style={{ width: `${led.brightness}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* RGB Color Picker */}
                {led.type === 'rgb' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Palette size={18} className="text-blue-400" />
                      <span className="text-sm font-medium text-white">צבע</span>
                    </div>
                    <div 
                      className="w-full h-20 rounded-xl border-2 border-dark-border shadow-lg transition-all hover:scale-[1.02]"
                      style={{ 
                        backgroundColor: `rgb(${led.rgbColor.r}, ${led.rgbColor.g}, ${led.rgbColor.b})`,
                        boxShadow: `0 8px 32px rgba(${led.rgbColor.r}, ${led.rgbColor.g}, ${led.rgbColor.b}, 0.3)`
                      }}
                    />
                    <div className="flex items-center gap-2 text-xs text-dark-textSecondary">
                      <span>RGB:</span>
                      <span className="text-red-400">R {led.rgbColor.r}</span>
                      <span className="text-green-400">G {led.rgbColor.g}</span>
                      <span className="text-blue-400">B {led.rgbColor.b}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Компоненты "Не настроено"
export const LEDListNotConfigured = () => (
  <div className="text-center py-8 text-dark-textSecondary">
    <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
    <p>אין נורות LED מוגדרות</p>
    <p className="text-xs mt-2">הגדר ב-Settings → הגדרת וידג'טים</p>
  </div>
)

export const LEDCardNotConfigured = () => (
  <div className="text-center py-8 text-dark-textSecondary">
    <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
    <p>אין נורות LED מוגדרות</p>
  </div>
)

export const LEDCompactNotConfigured = () => (
  <div className="text-center py-4 text-dark-textSecondary text-sm">
    <Lightbulb size={32} className="mx-auto mb-2 opacity-50" />
    <p>אין נורות LED מוגדרות</p>
  </div>
)

export const LEDModernNotConfigured = () => (
  <div className="text-center py-12 text-dark-textSecondary">
    <div className="p-4 bg-yellow-500/10 rounded-xl inline-block mb-4">
      <Lightbulb size={48} className="text-yellow-400/50" />
    </div>
    <p className="font-medium">אין נורות LED מוגדרות</p>
    <p className="text-xs mt-2">הגדר ב-Settings → הגדרת וידג'טים</p>
  </div>
)

