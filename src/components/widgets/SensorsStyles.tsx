import { Activity, Battery, BatteryFull, BatteryLow, BatteryMedium, Radio, User, Waves } from 'lucide-react'

export interface PreparedSensor {
  id: string
  name: string
  type: 'motion' | 'presence'
  isActive: boolean
  hasEntity: boolean
  powerType: 'battery' | 'electric'
  batteryLevel: number | null
}

interface SensorsStyleProps {
  sensors: PreparedSensor[]
}

const getBatteryIcon = (level: number | null) => {
  if (level === null) return Battery
  if (level <= 20) return BatteryLow
  if (level <= 50) return BatteryMedium
  if (level <= 80) return BatteryMedium
  return BatteryFull
}

const getBatteryColor = (level: number | null) => {
  if (level === null) return 'text-gray-500'
  if (level <= 20) return 'text-red-400'
  if (level <= 50) return 'text-yellow-400'
  return 'text-green-400'
}

const getTypeIcon = (sensor: PreparedSensor) => {
  if (sensor.type === 'motion') {
    return <Radio size={16} className={sensor.isActive ? 'text-blue-400' : 'text-gray-400'} />
  }
  return sensor.isActive ? (
    <Activity size={16} className="text-green-400" />
  ) : (
    <User size={16} className="text-gray-400" />
  )
}

const getTypeColor = (sensor: PreparedSensor) => {
  if (sensor.type === 'motion') {
    return sensor.isActive ? 'bg-blue-500/20' : 'bg-gray-500/20'
  }
  return sensor.isActive ? 'bg-green-500/20' : 'bg-gray-500/20'
}

const getStatusLabel = (sensor: PreparedSensor) => {
  if (sensor.type === 'motion') {
    return sensor.isActive ? 'פעיל' : 'לא פעיל'
  }
  return sensor.isActive ? 'נוכח' : 'נעדר'
}

const NotConfiguredBadge = ({ message }: { message: string }) => (
  <div className="text-xs text-dark-textSecondary">{message}</div>
)

export const SensorsListStyle = ({ sensors }: SensorsStyleProps) => (
  <div className="space-y-2">
    {sensors.map(sensor => {
      const BatteryIcon = getBatteryIcon(sensor.batteryLevel)
      const batteryColor = getBatteryColor(sensor.batteryLevel)

      return (
        <div
          key={sensor.id}
          className="flex items-center justify-between p-2.5 rounded-lg border border-dark-border hover:bg-dark-card transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${getTypeColor(sensor)}`}>
              {getTypeIcon(sensor)}
            </div>
            <div className="min-w-0">
              <div className={`text-sm truncate ${sensor.isActive ? 'text-white font-medium' : 'text-dark-textSecondary'}`}>
                {sensor.name}
              </div>
              <div className="text-xs text-dark-textSecondary">
                {sensor.hasEntity ? 'מחובר ל-Home Assistant' : 'לא מוגדר'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {sensor.powerType === 'battery' && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-dark-bg border border-dark-border text-xs ${batteryColor}`}>
                <BatteryIcon size={12} />
                <span>{sensor.batteryLevel !== null ? `${sensor.batteryLevel}%` : '--'}</span>
              </div>
            )}
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              sensor.isActive
                ? sensor.type === 'motion' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {getStatusLabel(sensor)}
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

export const SensorsCardStyle = ({ sensors }: SensorsStyleProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {sensors.map(sensor => {
      const BatteryIcon = getBatteryIcon(sensor.batteryLevel)
      const batteryColor = getBatteryColor(sensor.batteryLevel)

      return (
        <div
          key={sensor.id}
          className="p-4 rounded-xl border border-dark-border bg-gradient-to-br from-dark-card to-dark-bg shadow-inner"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(sensor)}`}>
                {sensor.type === 'motion' ? <Radio size={18} className="text-white" /> : sensor.isActive ? <Activity size={18} className="text-white" /> : <User size={18} className="text-white" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{sensor.name}</div>
                <div className="text-xs text-dark-textSecondary">
                  {sensor.type === 'motion' ? 'חיישן תנועה' : 'חיישן נוכחות'}
                </div>
              </div>
            </div>
            <div className={`text-xs font-medium ${sensor.hasEntity ? 'text-green-400' : 'text-red-400'}`}>
              {sensor.hasEntity ? 'מחובר' : 'לא מוגדר'}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-dark-textSecondary">סטטוס</div>
              <div className={`text-lg font-semibold ${sensor.isActive ? 'text-white' : 'text-dark-textSecondary'}`}>
                {getStatusLabel(sensor)}
              </div>
            </div>
            {sensor.powerType === 'battery' ? (
              <div className="flex items-center gap-2 text-sm">
                <BatteryIcon size={16} className={batteryColor} />
                <span className="text-dark-textSecondary">{sensor.batteryLevel !== null ? `${sensor.batteryLevel}%` : '--'}</span>
              </div>
            ) : (
              <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">חשמל</div>
            )}
          </div>
        </div>
      )
    })}
  </div>
)

export const SensorsCompactStyle = ({ sensors }: SensorsStyleProps) => (
  <div className="flex flex-col gap-1.5">
    {sensors.map(sensor => {
      const BatteryIcon = getBatteryIcon(sensor.batteryLevel)
      const batteryColor = getBatteryColor(sensor.batteryLevel)

      return (
        <div
          key={sensor.id}
          className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-dark-bg border border-dark-border/60"
        >
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${getTypeColor(sensor)}`}>
            {sensor.type === 'motion' ? <Radio size={12} /> : <Waves size={12} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs truncate ${sensor.isActive ? 'text-white' : 'text-dark-textSecondary'}`}>
              {sensor.name}
            </div>
          </div>
          {sensor.powerType === 'battery' && (
            <div className={`text-[10px] flex items-center gap-1 ${batteryColor}`}>
              <BatteryIcon size={10} />
              <span>{sensor.batteryLevel !== null ? `${sensor.batteryLevel}%` : '--'}</span>
            </div>
          )}
          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            sensor.isActive
              ? sensor.type === 'motion' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
              : 'bg-gray-500/20 text-gray-300'
          }`}>
            {getStatusLabel(sensor)}
          </div>
        </div>
      )
    })}
  </div>
)

export const SensorsGridStyle = ({ sensors }: SensorsStyleProps) => (
  <div className="grid grid-cols-2 gap-2">
    {sensors.map(sensor => {
      const BatteryIcon = getBatteryIcon(sensor.batteryLevel)
      const batteryColor = getBatteryColor(sensor.batteryLevel)

      return (
        <div
          key={sensor.id}
          className="p-3 rounded-2xl border border-dark-border bg-dark-card/80 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between text-xs text-dark-textSecondary">
            <span>{sensor.type === 'motion' ? 'תנועה' : 'נוכחות'}</span>
            <span className={sensor.hasEntity ? 'text-green-400' : 'text-red-400'}>
              {sensor.hasEntity ? 'מחובר' : 'לא מוגדר'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getTypeColor(sensor)}`}>
              {sensor.type === 'motion' ? <Radio size={16} /> : <Activity size={16} />}
            </div>
            <div className="text-sm font-medium text-white truncate">{sensor.name}</div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <div className={`font-semibold ${sensor.isActive ? 'text-white' : 'text-gray-400'}`}>
              {getStatusLabel(sensor)}
            </div>
            {sensor.powerType === 'battery' ? (
              <div className={`flex items-center gap-1 ${batteryColor}`}>
                <BatteryIcon size={12} />
                <span>{sensor.batteryLevel !== null ? `${sensor.batteryLevel}%` : '--'}</span>
              </div>
            ) : (
              <div className="text-green-400">∞</div>
            )}
          </div>
        </div>
      )
    })}
  </div>
)

export const SensorsListNotConfigured = () => (
  <div className="p-4 rounded-lg border border-dashed border-dark-border bg-dark-card/40 text-center">
    <div className="text-sm font-medium text-white mb-1">Sensors Widget</div>
    <NotConfiguredBadge message="Нет настроенных датчиков. Добавьте их слева." />
  </div>
)

export const SensorsCardNotConfigured = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {[1, 2].map(index => (
      <div key={index} className="p-4 rounded-xl border-2 border-dashed border-dark-border text-center bg-dark-card/30">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center">
          {index === 1 ? <Radio size={20} className="text-dark-textSecondary" /> : <Waves size={20} className="text-dark-textSecondary" />}
        </div>
        <div className="text-sm font-medium text-white">Դемо {index}</div>
        <NotConfiguredBadge message="Настройте датчики для отображения" />
      </div>
    ))}
  </div>
)

export const SensorsCompactNotConfigured = () => (
  <div className="flex flex-col gap-2 text-xs text-dark-textSecondary">
    {[1, 2, 3].map(index => (
      <div key={index} className="flex items-center gap-2 px-2 py-1.5 border border-dashed border-dark-border rounded-lg">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-dark-bg">
          {index % 2 === 0 ? <Radio size={10} /> : <User size={10} />}
        </div>
        <span className="flex-1 text-left">Датчик {index}</span>
        <span className="text-red-400">לא מוגדר</span>
      </div>
    ))}
  </div>
)

export const SensorsGridNotConfigured = () => (
  <div className="grid grid-cols-2 gap-2">
    {[1, 2, 3, 4].map(index => (
      <div key={index} className="p-3 rounded-2xl border border-dashed border-dark-border text-center text-xs text-dark-textSecondary">
        <div className="w-10 h-10 rounded-xl bg-dark-bg mx-auto mb-2 flex items-center justify-center">
          {index % 2 === 0 ? <Radio size={16} /> : <Activity size={16} />}
        </div>
        <div>Датчик {index}</div>
        <div className="text-red-400 mt-1">לא מוגדר</div>
      </div>
    ))}
  </div>
)

