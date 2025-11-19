// Preview компоненты для виджетов
import React from 'react'
import { Tv, Music, Wind, Droplet, Gauge, Sparkles } from 'lucide-react'
import { ACConfig, WaterHeaterConfig, SensorConfig, MotorConfig, BoseConfig, VacuumConfig, CameraConfig, TVPreviewConfig, WaterHeaterStyle, SensorsStyle, MotorsStyle, CamerasStyle } from '../../services/widgetConfig'
import { CompactNotConfigured, CardNotConfigured, MinimalNotConfigured, ModernNotConfigured } from '../widgets/WaterHeaterStyles'
import { PreparedSensor, SensorsListStyle, SensorsCardStyle, SensorsCompactStyle, SensorsGridStyle, SensorsListNotConfigured, SensorsCardNotConfigured, SensorsCompactNotConfigured, SensorsGridNotConfigured } from '../widgets/SensorsStyles'
import { PreparedMotor, MotorsListStyle, MotorsCardStyle, MotorsCompactStyle, MotorsListNotConfigured, MotorsCardNotConfigured, MotorsCompactNotConfigured } from '../widgets/MotorsStyles'
import { PreparedCamera, CamerasListStyle, CamerasCardStyle, CamerasCompactStyle, CamerasGridStyle, CamerasListNotConfigured, CamerasCardNotConfigured, CamerasCompactNotConfigured, CamerasGridNotConfigured } from '../widgets/CamerasStyles'

export const TVTimePreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">TV Time</span>
        <span className="text-xs text-dark-textSecondary">Сегодня</span>
      </div>
      <div className="text-2xl font-bold text-blue-400">2ч 45м</div>
      <div className="text-xs text-dark-textSecondary mt-1">Время просмотра</div>
    </div>
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="text-xs text-dark-textSecondary mb-1">Неделя</div>
      <div className="text-lg font-semibold text-white">18ч 30м</div>
    </div>
  </div>
)

export const MediaPlayerPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <Music size={24} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Media Player</div>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
      </div>
    </div>
  </div>
)

export const SpotifyPreview = ({ config }: { config: SpotifyConfig }) => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">
            {config.coverEmoji || '🎵'}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{config.accountName}</div>
            <div className="text-xs text-dark-textSecondary">
              {config.trackName} — {config.artistName}
            </div>
          </div>
        </div>
        <div className="text-xs text-dark-textSecondary">{config.deviceName}</div>
      </div>
      <div className="w-full bg-dark-bg/50 h-1.5 rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
          style={{ width: `${config.progress}%` }}
        />
      </div>
      <div className="text-[10px] text-dark-textSecondary">
        {config.isPlaying ? 'Воспроизведение' : 'На паузе'}
      </div>
    </div>
  </div>
)

export const MediaRoomPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Tv size={24} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Media Room</div>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
      </div>
    </div>
  </div>
)

export const CanvasPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <Tv size={24} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Canvas</div>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
      </div>
    </div>
  </div>
)

export const TVPreviewWidget = ({ configs }: { configs: TVPreviewConfig[] }) => (
  <div className="space-y-3">
    {configs.length > 0 ? configs.map((tv, index) => (
      <div key={index} className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Tv size={24} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{tv.name || 'TV Preview'}</div>
            <div className="text-xs text-dark-textSecondary">
              {tv.entityId ? 'מוגדר' : 'לא מוגדר'}
            </div>
          </div>
        </div>
        {/* Миниатюрный дизайн телевизора */}
        <div className="mt-3 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded border-2 border-gray-700 overflow-hidden">
          <div className="h-16 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center">
            <Tv size={24} className="text-white/30" />
          </div>
          <div className="h-1 bg-gray-800"></div>
        </div>
      </div>
    )) : (
      <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="text-sm text-dark-textSecondary">אין טלוויזיות מוגדרות</div>
      </div>
    )}
  </div>
)

export const PlexPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Tv size={24} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Plex</div>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
      </div>
    </div>
  </div>
)

export const TVDurationPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="text-sm font-medium text-white mb-2">TV Duration</div>
      <div className="text-2xl font-bold text-blue-400 mb-1">2ч 45м</div>
      <div className="text-xs text-dark-textSecondary">Сегодня</div>
    </div>
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="text-xs text-dark-textSecondary mb-1">Неделя</div>
      <div className="text-lg font-semibold text-white">18ч 30м</div>
    </div>
  </div>
)

export const WeatherCalendarPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-white">Погода</div>
        <div className="text-xs text-dark-textSecondary">22°C</div>
      </div>
      <div className="text-xs text-dark-textSecondary">Ясно</div>
    </div>
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="text-sm font-medium text-white mb-2">Календарь</div>
      <div className="text-xs text-dark-textSecondary">Не настроен</div>
    </div>
  </div>
)

export const LivingRoomPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Tv size={24} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Living Room</div>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
      </div>
    </div>
  </div>
)

export const ACPreview = ({ configs }: { configs: ACConfig[] }) => (
  <div className="space-y-3">
    {configs.length > 0 ? configs.map((ac, index) => (
      <div key={index} className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Wind size={24} className="text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{ac.name || 'Кондиционер'}</div>
            <div className="text-xs text-dark-textSecondary">
              {ac.entityId ? 'Настроен' : 'Не настроен'}
            </div>
          </div>
        </div>
      </div>
    )) : (
      <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="text-sm text-dark-textSecondary">Нет настроенных кондиционеров</div>
      </div>
    )}
  </div>
)

export const WaterHeaterPreview = ({ config, style }: { config: WaterHeaterConfig, style?: WaterHeaterStyle }) => {
  const currentStyle = style || config.style || 'compact'
  const friendlyName = config.name || 'Водонагреватель'
  
  // Если не настроен, показываем соответствующий компонент "Не настроен"
  if (!config.entityId) {
    const notConfiguredProps = { friendlyName }
    switch (currentStyle) {
      case 'card':
        return <CardNotConfigured {...notConfiguredProps} />
      case 'minimal':
        return <MinimalNotConfigured {...notConfiguredProps} />
      case 'modern':
        return <ModernNotConfigured {...notConfiguredProps} />
      case 'compact':
      default:
        return <CompactNotConfigured {...notConfiguredProps} />
    }
  }
  
  // Если настроен, показываем простой превью
  return (
    <div className="space-y-3">
      <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Droplet size={24} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{friendlyName}</div>
            <div className="text-xs text-dark-textSecondary">
              Настроен
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const SensorsPreview = ({ configs = [], demo = false, style = 'list' }: { configs: SensorConfig[], demo?: boolean, style?: SensorsStyle }) => {
  if (demo) {
    const demoSensors: PreparedSensor[] = [
      { id: 'motion-1', name: 'חיישן תנועה סלון', type: 'motion', isActive: true, hasEntity: true, powerType: 'electric', batteryLevel: null },
      { id: 'motion-2', name: 'חיישן תנועה מסדרון', type: 'motion', isActive: false, hasEntity: true, powerType: 'battery', batteryLevel: 58 },
      { id: 'presence-1', name: 'חיישן נוכחות 1', type: 'presence', isActive: true, hasEntity: true, powerType: 'electric', batteryLevel: null },
      { id: 'presence-2', name: 'חיישן נוכחות 2', type: 'presence', isActive: false, hasEntity: false, powerType: 'battery', batteryLevel: 15 },
    ]

    const renderDemoByStyle = () => {
      const props = { sensors: demoSensors }
      switch (style) {
        case 'card':
          return <SensorsCardStyle {...props} />
        case 'compact':
          return <SensorsCompactStyle {...props} />
        case 'grid':
          return <SensorsGridStyle {...props} />
        case 'list':
        default:
          return <SensorsListStyle {...props} />
      }
    }

    return (
      <div className="space-y-5">
        <div className="text-xs text-dark-textSecondary bg-white/5 border border-dark-border rounded-lg px-3 py-2 flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          Показан демо-режим: пример того, как виджет Sensors выглядит на панели
        </div>
        {renderDemoByStyle()}
      </div>
    )
  }

  const preparedSensors: PreparedSensor[] = configs.map((sensor, index) => ({
    id: sensor.entityId || `sensor-preview-${index}`,
    name: sensor.name || `חיישן ${index + 1}`,
    type: sensor.type,
    isActive: !!sensor.entityId,
    hasEntity: sensor.entityId !== null,
    powerType: sensor.powerType || 'electric',
    batteryLevel: sensor.powerType === 'battery' ? 75 : null,
  }))

  const renderByStyle = () => {
    if (preparedSensors.length === 0) {
      switch (style) {
        case 'card':
          return <SensorsCardNotConfigured />
        case 'compact':
          return <SensorsCompactNotConfigured />
        case 'grid':
          return <SensorsGridNotConfigured />
        case 'list':
        default:
          return <SensorsListNotConfigured />
      }
    }

    const props = { sensors: preparedSensors }
    switch (style) {
      case 'card':
        return <SensorsCardStyle {...props} />
      case 'compact':
        return <SensorsCompactStyle {...props} />
      case 'grid':
        return <SensorsGridStyle {...props} />
      case 'list':
      default:
        return <SensorsListStyle {...props} />
    }
  }

  return renderByStyle()
}

export const MotorsPreview = ({ configs = [], style = 'list', demo = false }: { configs: MotorConfig[], style?: MotorsStyle, demo?: boolean }) => {
  const buildPreparedMotors = (items: { id: string; name: string; isConnected: boolean; state: string; position: number | null }[]): PreparedMotor[] => {
    const stateMap: Record<string, { label: string; color: string }> = {
      open: { label: 'פתוח', color: 'text-green-400' },
      closed: { label: 'סגור', color: 'text-gray-400' },
      opening: { label: 'נפתח', color: 'text-yellow-400' },
      closing: { label: 'נסגר', color: 'text-yellow-400' },
      stopped: { label: 'עצר', color: 'text-blue-400' },
      disconnected: { label: 'לא מחובר', color: 'text-red-400' }
    }

    return items.map(item => {
      const stateInfo = stateMap[item.state] || { label: item.state, color: 'text-gray-400' }
      return {
        id: item.id,
        name: item.name,
        isConnected: item.isConnected,
        stateLabel: stateInfo.label,
        stateColor: stateInfo.color,
        position: item.position,
        controlsDisabled: true
      }
    })
  }

  if (demo) {
    const demoItems = buildPreparedMotors([
      { id: 'motor-1', name: 'תריס סלון', isConnected: true, state: 'open', position: 78 },
      { id: 'motor-2', name: 'וילון שינה', isConnected: true, state: 'closing', position: 42 },
      { id: 'motor-3', name: 'שער חניה', isConnected: false, state: 'disconnected', position: null }
    ])

    const renderDemo = () => {
      const props = { motors: demoItems }
      switch (style) {
        case 'card':
          return <MotorsCardStyle {...props} />
        case 'compact':
          return <MotorsCompactStyle {...props} />
        case 'list':
        default:
          return <MotorsListStyle {...props} />
      }
    }

    return (
      <div className="space-y-4">
        <div className="text-xs text-dark-textSecondary bg-white/5 border border-dark-border rounded-lg px-3 py-2 flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          Показан демо-режим: пример отображения Motor Widget
        </div>
        {renderDemo()}
      </div>
    )
  }

  const prepared = buildPreparedMotors(
    configs.length > 0
      ? configs.map((motor, index) => ({
          id: motor.entityId || `motor-${index}`,
          name: motor.name || `מנוע ${index + 1}`,
          isConnected: !!motor.entityId,
          state: motor.entityId ? 'closed' : 'disconnected',
          position: motor.entityId ? 50 : null
        }))
      : []
  )

  if (prepared.length === 0) {
    switch (style) {
      case 'card':
        return <MotorsCardNotConfigured />
      case 'compact':
        return <MotorsCompactNotConfigured />
      case 'list':
      default:
        return <MotorsListNotConfigured />
    }
  }

  const props = { motors: prepared }
  switch (style) {
    case 'card':
      return <MotorsCardStyle {...props} />
    case 'compact':
      return <MotorsCompactStyle {...props} />
    case 'list':
    default:
      return <MotorsListStyle {...props} />
  }
}

export const BosePreview = ({ configs }: { configs: BoseConfig[] }) => (
  <div className="space-y-3">
    {configs.length > 0 ? configs.map((bose, index) => (
      <div key={index} className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Music size={24} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{bose.name || 'Bose Soundbar'}</div>
            <div className="text-xs text-dark-textSecondary">
              {bose.entityId ? 'Настроен' : 'Не настроен'}
            </div>
          </div>
        </div>
      </div>
    )) : (
      <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="text-sm text-dark-textSecondary">Нет настроенных звуковых панелей</div>
      </div>
    )}
  </div>
)

export const VacuumPreview = ({ configs }: { configs: VacuumConfig[] }) => (
  <div className="space-y-3">
    {configs.length > 0 ? configs.map((vacuum, index) => (
      <div key={index} className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Sparkles size={24} className="text-green-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{vacuum.name || 'Пылесос'}</div>
            <div className="text-xs text-dark-textSecondary">
              {vacuum.entityId ? 'Настроен' : 'Не настроен'}
            </div>
          </div>
        </div>
      </div>
    )) : (
      <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="text-sm text-dark-textSecondary">Нет настроенных пылесосов</div>
      </div>
    )}
  </div>
)

export const CamerasPreview = ({ configs, style, demo }: { configs: CameraConfig[], style: CamerasStyle, demo?: boolean }) => {
  if (demo) {
    // Mock данные для демо
    const mockCameras: PreparedCamera[] = [
      { id: '1', name: 'Камера входа', imageUrl: null, hasEntity: true, isOnline: true },
      { id: '2', name: 'Камера заднего двора', imageUrl: null, hasEntity: true, isOnline: true },
      { id: '3', name: 'Камера гаража', imageUrl: null, hasEntity: true, isOnline: false },
    ]
    const props = { cameras: mockCameras }
    switch (style) {
      case 'card':
        return <CamerasCardStyle {...props} />
      case 'compact':
        return <CamerasCompactStyle {...props} />
      case 'grid':
        return <CamerasGridStyle {...props} />
      case 'list':
      default:
        return <CamerasListStyle {...props} />
    }
  }

  if (configs.length === 0) {
    switch (style) {
      case 'card':
        return <CamerasCardNotConfigured />
      case 'compact':
        return <CamerasCompactNotConfigured />
      case 'grid':
        return <CamerasGridNotConfigured />
      case 'list':
      default:
        return <CamerasListNotConfigured />
    }
  }

  const prepared: PreparedCamera[] = configs.map((camera, index) => ({
    id: camera.entityId || `camera-${index}`,
    name: camera.name || 'Камера',
    imageUrl: null, // В превью не загружаем реальные изображения
    hasEntity: camera.entityId !== null,
    isOnline: camera.entityId !== null, // Предполагаем онлайн, если настроен
  }))

  const props = { cameras: prepared }
  switch (style) {
    case 'card':
      return <CamerasCardStyle {...props} />
    case 'compact':
      return <CamerasCompactStyle {...props} />
    case 'grid':
      return <CamerasGridStyle {...props} />
    case 'list':
    default:
      return <CamerasListStyle {...props} />
  }
}

