// Preview компоненты для виджетов
import React from 'react'
import { Tv, Music, Wind, Droplet, Activity, User, Gauge, Sparkles, Radio, Waves, Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react'
import { ACConfig, WaterHeaterConfig, SensorConfig, MotorConfig, BoseConfig, VacuumConfig, WaterHeaterStyle } from '../../services/widgetConfig'
import { CompactNotConfigured, CardNotConfigured, MinimalNotConfigured, ModernNotConfigured } from '../widgets/WaterHeaterStyles'

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

export const SpotifyPreview = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
          <Music size={24} className="text-green-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Spotify</div>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
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

export const TVPreviewWidget = () => (
  <div className="space-y-3">
    <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Tv size={24} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">TV Preview</div>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
      </div>
    </div>
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

export const SensorsPreview = ({ configs = [], demo = false }: { configs: SensorConfig[], demo?: boolean }) => {
  if (demo) {
    type DemoSensor = SensorConfig & { status: 'active' | 'inactive', batteryLevel?: number | null }
    const motionSensors: DemoSensor[] = [
      { name: 'חיישן תנועה סלון', entityId: 'demo.motion.living', type: 'motion', powerType: 'electric', status: 'active' },
      { name: 'חיישן תנועה מסדרון', entityId: 'demo.motion.hall', type: 'motion', powerType: 'battery', batteryEntityId: 'demo.motion.hall.battery', batteryLevel: 58, status: 'inactive' }
    ]
    const presenceSensors: DemoSensor[] = [
      { name: 'חיישן נוכחות 1', entityId: 'demo.presence.office', type: 'presence', powerType: 'electric', status: 'active' },
      { name: 'חיישן נוכחות 2', entityId: null, type: 'presence', powerType: 'battery', batteryEntityId: 'demo.presence.hall.battery', batteryLevel: 15, status: 'inactive' }
    ]

    const getBatteryIcon = (level: number | undefined | null) => {
      if (level === undefined || level === null) return Battery
      if (level <= 20) return BatteryLow
      if (level <= 50) return BatteryMedium
      if (level <= 80) return BatteryMedium
      return BatteryFull
    }

    const getBatteryColor = (level: number | undefined | null) => {
      if (level === undefined || level === null) return 'text-gray-500'
      if (level <= 20) return 'text-red-400'
      if (level <= 40) return 'text-yellow-400'
      return 'text-green-400'
    }

    const renderSensorRow = (sensor: DemoSensor, domain: 'motion' | 'presence') => {
      const isActive = sensor.status === 'active'
      const batteryLevel = sensor.powerType === 'battery' ? (sensor.batteryLevel ?? null) : null
      const BatteryIcon = getBatteryIcon(batteryLevel)
      const batteryColor = getBatteryColor(batteryLevel)

      return (
        <div
          key={sensor.name}
          className="flex items-center justify-between p-2.5 rounded-lg border border-dark-border bg-dark-card/40 hover:bg-dark-card transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
              isActive
                ? domain === 'motion' ? 'bg-blue-500/20' : 'bg-green-500/20'
                : 'bg-gray-500/20'
            }`}>
              {domain === 'motion' ? (
                <Radio size={14} className={isActive ? 'text-blue-400' : 'text-gray-400'} />
              ) : isActive ? (
                <Activity size={14} className="text-green-400" />
              ) : (
                <User size={14} className="text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className={`text-sm truncate ${isActive ? 'text-white font-medium' : 'text-dark-textSecondary'}`}>
                {sensor.name}
              </div>
              <div className="text-xs text-dark-textSecondary">
                {sensor.entityId ? 'מחובר ל-Home Assistant' : 'לא מוגדר'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {sensor.powerType === 'battery' && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark-bg border border-dark-border text-xs ${batteryColor}`}>
                <BatteryIcon size={12} />
                <span>{batteryLevel !== null ? `${batteryLevel}%` : '--'}</span>
              </div>
            )}
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isActive
                ? domain === 'motion' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {domain === 'motion' ? (isActive ? 'פעיל' : 'לא פעיל') : (isActive ? 'נוכח' : 'נעדר')}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="text-xs text-dark-textSecondary bg-white/5 border border-dark-border rounded-lg px-3 py-2 flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          Показан демо-режим: пример того, как виджет Sensors выглядит на панели
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-500/20">
              <Radio size={16} className="text-blue-400" />
            </div>
            <div className="font-medium text-white text-sm">Датчики движения</div>
            <span className="text-xs text-dark-textSecondary">2 חיישנים</span>
          </div>
          <div className="space-y-2">
            {motionSensors.map(sensor => renderSensorRow(sensor, 'motion'))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-green-500/20">
              <Waves size={16} className="text-green-400" />
            </div>
            <div className="font-medium text-white text-sm">חיישני נוכחות</div>
            <span className="text-xs text-dark-textSecondary">2 חיישנים</span>
          </div>
          <div className="space-y-2">
            {presenceSensors.map(sensor => renderSensorRow(sensor, 'presence'))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {configs.length > 0 ? configs.map((sensor, index) => (
        <div key={index} className="p-3 bg-dark-card rounded-lg border border-dark-border">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              sensor.type === 'motion' ? 'bg-blue-500/20' : 'bg-green-500/20'
            }`}>
              {sensor.type === 'motion' ? (
                <Activity size={24} className="text-blue-400" />
              ) : (
                <User size={24} className="text-green-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{sensor.name || 'Датчик'}</div>
              <div className="text-xs text-dark-textSecondary">
                {sensor.entityId ? 'Настроен' : 'Не настроен'}
              </div>
            </div>
          </div>
        </div>
      )) : (
        <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
          <div className="text-sm text-dark-textSecondary">Нет настроенных датчиков</div>
        </div>
      )}
    </div>
  )
}

export const MotorsPreview = ({ configs }: { configs: MotorConfig[] }) => (
  <div className="space-y-3">
    {configs.length > 0 ? configs.map((motor, index) => (
      <div key={index} className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Gauge size={24} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{motor.name || 'Мотор'}</div>
            <div className="text-xs text-dark-textSecondary">
              {motor.entityId ? 'Настроен' : 'Не настроен'}
            </div>
          </div>
        </div>
      </div>
    )) : (
      <div className="p-3 bg-dark-card rounded-lg border border-dark-border">
        <div className="text-sm text-dark-textSecondary">Нет настроенных моторов</div>
      </div>
    )}
  </div>
)

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

