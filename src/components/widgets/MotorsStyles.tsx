import { Activity, ChevronDown, ChevronUp, Gauge, Square } from 'lucide-react'

export interface PreparedMotor {
  id: string
  name: string
  isConnected: boolean
  stateLabel: string
  stateColor: string
  position: number | null
  controlsDisabled: boolean
}

interface MotorsStyleProps {
  motors: PreparedMotor[]
  onAction?: (motor: PreparedMotor, action: 'open' | 'close' | 'stop') => void
}

const StateBadge = ({ motor }: { motor: PreparedMotor }) => (
  <div className={`text-xs font-medium ${motor.stateColor}`}>{motor.stateLabel}</div>
)

const PositionBar = ({ motor }: { motor: PreparedMotor }) =>
  motor.position !== null ? (
    <div>
      <div className="flex items-center justify-between mb-1 text-[10px] text-dark-textSecondary">
        <span>מיקום</span>
        <span className="text-white font-semibold">{motor.position}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-dark-card overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-300 transition-all"
          style={{ width: `${motor.position}%` }}
        />
      </div>
    </div>
  ) : (
    <div className="text-[10px] text-dark-textSecondary">אין מידע על המיקום</div>
  )

const ControlButtons = ({ motor, onAction }: { motor: PreparedMotor; onAction?: MotorsStyleProps['onAction'] }) => (
  <div className="flex gap-1">
    <button
      onClick={() => onAction?.(motor, 'open')}
      className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center justify-center gap-1"
      disabled={!onAction || motor.controlsDisabled}
    >
      <ChevronUp size={12} />
      פתוח
    </button>
    <button
      onClick={() => onAction?.(motor, 'stop')}
      className="px-2 py-1 bg-yellow-600 text-white rounded text-xs flex items-center justify-center gap-1"
      disabled={!onAction || motor.controlsDisabled}
    >
      <Square size={11} />
      עצור
    </button>
    <button
      onClick={() => onAction?.(motor, 'close')}
      className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs flex items-center justify-center gap-1"
      disabled={!onAction || motor.controlsDisabled}
    >
      <ChevronDown size={12} />
      סגור
    </button>
  </div>
)

export const MotorsListStyle = ({ motors, onAction }: MotorsStyleProps) => (
  <div className="space-y-3">
    {motors.map(motor => (
      <div key={motor.id} className="p-3 rounded-lg border border-dark-border bg-dark-bg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Gauge size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{motor.name}</div>
              <StateBadge motor={motor} />
            </div>
          </div>
          <div className="text-xs text-dark-textSecondary">{motor.isConnected ? 'מחובר ל-HA' : 'לא מוגדר'}</div>
        </div>
        <PositionBar motor={motor} />
        <div className="mt-3">
          <ControlButtons motor={motor} onAction={onAction} />
        </div>
      </div>
    ))}
  </div>
)

export const MotorsCardStyle = ({ motors, onAction }: MotorsStyleProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {motors.map(motor => (
      <div key={motor.id} className="p-4 rounded-2xl border border-dark-border bg-gradient-to-br from-dark-card to-dark-bg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Gauge size={22} className="text-blue-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-white">{motor.name}</div>
            <StateBadge motor={motor} />
          </div>
        </div>
        <PositionBar motor={motor} />
        <div className="mt-4">
          <ControlButtons motor={motor} onAction={onAction} />
        </div>
      </div>
    ))}
  </div>
)

export const MotorsCompactStyle = ({ motors, onAction }: MotorsStyleProps) => (
  <div className="flex flex-col gap-2">
    {motors.map(motor => (
      <div key={motor.id} className="p-2 rounded-lg border border-dark-border bg-dark-card flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Gauge size={14} className="text-blue-400" />
            <span className="font-medium">{motor.name}</span>
          </div>
          <StateBadge motor={motor} />
        </div>
        <PositionBar motor={motor} />
        <ControlButtons motor={motor} onAction={onAction} />
      </div>
    ))}
  </div>
)

export const MotorsListNotConfigured = () => (
  <div className="p-4 rounded-lg border border-dashed border-dark-border text-center text-sm text-dark-textSecondary">
    Нет подключённых моторных устройств. Добавьте их слева.
  </div>
)

export const MotorsCardNotConfigured = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {[1, 2].map(index => (
      <div key={index} className="p-4 rounded-2xl border border-dashed border-dark-border bg-dark-card/40 text-center text-sm text-dark-textSecondary">
        <div className="w-12 h-12 rounded-full bg-dark-bg border border-dark-border mx-auto mb-3 flex items-center justify-center">
          <Gauge size={20} className="text-dark-textSecondary" />
        </div>
        <div>Мотор {index}</div>
        <div className="text-xs text-red-400 mt-1">לא מוגדר</div>
      </div>
    ))}
  </div>
)

export const MotorsCompactNotConfigured = () => (
  <div className="flex flex-col gap-2 text-xs text-dark-textSecondary">
    {[1, 2, 3].map(index => (
      <div key={index} className="px-3 py-2 border border-dashed border-dark-border rounded-lg flex items-center justify-between">
        <span>מנוע {index}</span>
        <span className="text-red-400">לא מוגדר</span>
      </div>
    ))}
  </div>
)

