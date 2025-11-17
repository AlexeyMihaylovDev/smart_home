import { Flame, Power, Thermometer, Droplet, Settings, AlertCircle } from 'lucide-react'

interface WaterHeaterStyleProps {
  friendlyName: string
  currentTemp: number
  targetTemp: number
  isOn: boolean
  loading: boolean
  minTemp: number
  maxTemp: number
  tempStep: number
  onTempChange: (delta: number) => void
  onTurnOn: () => void
  onTurnOff: () => void
}

// Стиль 1: Compact (текущий компактный стиль)
export const CompactStyle = ({
  friendlyName,
  currentTemp,
  targetTemp,
  isOn,
  loading,
  minTemp,
  maxTemp,
  tempStep,
  onTempChange,
  onTurnOn,
  onTurnOff
}: WaterHeaterStyleProps) => {
  const tempRange = maxTemp - minTemp
  const tempPosition = ((targetTemp - minTemp) / tempRange) * 360

  return (
    <div className="h-full p-3 flex flex-col items-center justify-center overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="font-medium text-sm text-white truncate flex-1 mr-2">{friendlyName}</h3>
      </div>

      {/* Круговой регулятор температуры */}
      <div className="relative mb-2 flex items-center justify-center flex-1 min-h-0 w-full">
        <div className="relative w-full max-w-[140px] aspect-square">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Фоновый круг */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
            />
            {/* Активный сегмент */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={isOn ? "#f97316" : "#6b7280"}
              strokeWidth="12"
              strokeDasharray={`${(tempPosition / 360) * 502.65} 502.65`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* Центральная информация */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] font-semibold mb-0.5 text-white">
              {isOn ? 'HEAT' : 'OFF'}
            </div>
            <div className="text-3xl font-bold mb-0 text-white">
              {targetTemp.toFixed(0)}
            </div>
            <div className="text-xs text-dark-textSecondary mb-1">°C</div>
            <div className="flex items-center gap-0.5 text-[10px] text-dark-textSecondary">
              <Thermometer size={10} className="text-orange-400" />
              <span>{currentTemp.toFixed(0)}°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки изменения температуры */}
      <div className="flex items-center justify-center gap-3 mb-2 w-full">
        <button
          onClick={() => onTempChange(-tempStep)}
          disabled={loading || targetTemp <= minTemp || !isOn}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-light text-white hover:scale-110 active:scale-95 flex-shrink-0"
        >
          −
        </button>
        <button
          onClick={() => onTempChange(tempStep)}
          disabled={loading || targetTemp >= maxTemp || !isOn}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg font-light text-white hover:scale-110 active:scale-95 flex-shrink-0"
        >
          +
        </button>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={isOn ? onTurnOff : onTurnOn}
          disabled={loading}
          className={`flex-1 py-2 px-2 rounded-lg transition-all ${
            isOn
              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              : 'bg-white/5 hover:bg-white/10 text-dark-textSecondary border border-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          title="Питание"
        >
          <Power size={18} />
        </button>
        <button
          onClick={onTurnOn}
          disabled={loading || isOn}
          className={`flex-1 py-2 px-2 rounded-lg transition-all ${
            isOn
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-white/5 hover:bg-white/10 text-dark-textSecondary border border-white/10'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          title="Нагрев"
        >
          <Flame size={18} />
        </button>
      </div>
    </div>
  )
}

// Стиль 2: Card (карточный стиль)
export const CardStyle = ({
  friendlyName,
  currentTemp,
  targetTemp,
  isOn,
  loading,
  minTemp,
  maxTemp,
  tempStep,
  onTempChange,
  onTurnOn,
  onTurnOff
}: WaterHeaterStyleProps) => {
  return (
    <div className="h-full p-4 flex flex-col bg-dark-card rounded-lg border border-dark-border">
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
          isOn ? 'bg-orange-500/20' : 'bg-dark-bg'
        }`}>
          <Droplet size={24} className={isOn ? 'text-orange-400' : 'text-dark-textSecondary'} />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white">{friendlyName}</h3>
          <div className="text-xs text-dark-textSecondary">
            {isOn ? 'Нагрев включен' : 'Выключен'}
          </div>
        </div>
      </div>

      {/* Температуры */}
      <div className="flex items-center justify-between mb-4 p-3 bg-dark-bg rounded-lg">
        <div className="text-center flex-1">
          <div className="text-xs text-dark-textSecondary mb-1">Текущая</div>
          <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
            <Thermometer size={20} className="text-blue-400" />
            {currentTemp.toFixed(0)}°C
          </div>
        </div>
        <div className="w-px h-12 bg-dark-border mx-2"></div>
        <div className="text-center flex-1">
          <div className="text-xs text-dark-textSecondary mb-1">Целевая</div>
          <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
            isOn ? 'text-orange-400' : 'text-white'
          }`}>
            <Flame size={20} />
            {targetTemp.toFixed(0)}°C
          </div>
        </div>
      </div>

      {/* Регулятор температуры */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-dark-textSecondary">Температура</span>
          <span className="text-sm font-medium text-white">{targetTemp.toFixed(0)}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTempChange(-tempStep)}
            disabled={loading || targetTemp <= minTemp || !isOn}
            className="w-10 h-10 rounded-lg bg-dark-bg border border-dark-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-white"
          >
            −
          </button>
          <div className="flex-1 h-2 bg-dark-bg rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isOn ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-dark-border'
              }`}
              style={{ width: `${((targetTemp - minTemp) / (maxTemp - minTemp)) * 100}%` }}
            />
          </div>
          <button
            onClick={() => onTempChange(tempStep)}
            disabled={loading || targetTemp >= maxTemp || !isOn}
            className="w-10 h-10 rounded-lg bg-dark-bg border border-dark-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-white"
          >
            +
          </button>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={isOn ? onTurnOff : onTurnOn}
          disabled={loading}
          className={`flex-1 py-2.5 px-4 rounded-lg transition-all font-medium ${
            isOn
              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              : 'bg-dark-bg hover:bg-white/5 text-dark-textSecondary border border-dark-border'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          <Power size={18} />
          <span>{isOn ? 'Выключить' : 'Включить'}</span>
        </button>
        <button
          onClick={onTurnOn}
          disabled={loading || isOn}
          className={`flex-1 py-2.5 px-4 rounded-lg transition-all font-medium ${
            isOn
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-dark-bg hover:bg-white/5 text-dark-textSecondary border border-dark-border'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          <Flame size={18} />
          <span>Нагрев</span>
        </button>
      </div>
    </div>
  )
}

// Стиль 3: Minimal (минималистичный)
export const MinimalStyle = ({
  friendlyName,
  currentTemp,
  targetTemp,
  isOn,
  loading,
  minTemp,
  maxTemp,
  tempStep,
  onTempChange,
  onTurnOn,
  onTurnOff
}: WaterHeaterStyleProps) => {
  return (
    <div className="h-full p-4 flex flex-col">
      {/* Заголовок */}
      <div className="mb-4">
        <h3 className="font-medium text-white text-sm mb-1">{friendlyName}</h3>
        <div className={`text-xs ${isOn ? 'text-orange-400' : 'text-dark-textSecondary'}`}>
          {isOn ? '● Активен' : '○ Неактивен'}
        </div>
      </div>

      {/* Температура */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="text-center">
          <div className="text-5xl font-bold text-white mb-1">
            {targetTemp.toFixed(0)}
          </div>
          <div className="text-sm text-dark-textSecondary">
            Текущая: {currentTemp.toFixed(0)}°C
          </div>
        </div>
      </div>

      {/* Управление */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTempChange(-tempStep)}
            disabled={loading || targetTemp <= minTemp || !isOn}
            className="flex-1 py-2 rounded-lg bg-dark-bg border border-dark-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white"
          >
            −
          </button>
          <button
            onClick={() => onTempChange(tempStep)}
            disabled={loading || targetTemp >= maxTemp || !isOn}
            className="flex-1 py-2 rounded-lg bg-dark-bg border border-dark-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white"
          >
            +
          </button>
        </div>
        <button
          onClick={isOn ? onTurnOff : onTurnOn}
          disabled={loading}
          className={`w-full py-2.5 rounded-lg transition-all font-medium ${
            isOn
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-dark-bg hover:bg-white/5 text-dark-textSecondary border border-dark-border'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isOn ? 'Выключить' : 'Включить'}
        </button>
      </div>
    </div>
  )
}

// Стиль 4: Modern (современный с градиентами)
export const ModernStyle = ({
  friendlyName,
  currentTemp,
  targetTemp,
  isOn,
  loading,
  minTemp,
  maxTemp,
  tempStep,
  onTempChange,
  onTurnOn,
  onTurnOff
}: WaterHeaterStyleProps) => {
  const tempRange = maxTemp - minTemp
  const tempProgress = ((targetTemp - minTemp) / tempRange) * 100

  return (
    <div className={`h-full p-4 flex flex-col rounded-lg border transition-all ${
      isOn 
        ? 'bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/30' 
        : 'bg-dark-card border-dark-border'
    }`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{friendlyName}</h3>
          <div className="text-xs text-dark-textSecondary mt-0.5">
            {isOn ? 'Нагрев активен' : 'Ожидание'}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isOn 
            ? 'bg-orange-500/20 shadow-lg shadow-orange-500/30' 
            : 'bg-dark-bg'
        }`}>
          <Droplet size={20} className={isOn ? 'text-orange-400' : 'text-dark-textSecondary'} />
        </div>
      </div>

      {/* Круговой индикатор */}
      <div className="relative mb-4 flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={isOn ? "url(#gradient)" : "#6b7280"}
              strokeWidth="6"
              strokeDasharray={`${(tempProgress / 100) * 251.2} 251.2`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white">{targetTemp.toFixed(0)}</div>
            <div className="text-xs text-dark-textSecondary">°C</div>
            <div className="text-[10px] text-dark-textSecondary mt-1">
              {currentTemp.toFixed(0)}°C
            </div>
          </div>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="mb-4">
        <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isOn 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                : 'bg-dark-border'
            }`}
            style={{ width: `${tempProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-dark-textSecondary mt-1">
          <span>{minTemp}°C</span>
          <span>{maxTemp}°C</span>
        </div>
      </div>

      {/* Управление */}
      <div className="space-y-2 mt-auto">
        <div className="flex gap-2">
          <button
            onClick={() => onTempChange(-tempStep)}
            disabled={loading || targetTemp <= minTemp || !isOn}
            className="flex-1 py-2 rounded-lg bg-dark-bg/50 border border-dark-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
          >
            −
          </button>
          <button
            onClick={() => onTempChange(tempStep)}
            disabled={loading || targetTemp >= maxTemp || !isOn}
            className="flex-1 py-2 rounded-lg bg-dark-bg/50 border border-dark-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
          >
            +
          </button>
        </div>
        <button
          onClick={isOn ? onTurnOff : onTurnOn}
          disabled={loading}
          className={`w-full py-3 rounded-lg transition-all font-semibold ${
            isOn
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30'
              : 'bg-dark-bg hover:bg-white/5 text-dark-textSecondary border border-dark-border'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          <Power size={18} />
          <span>{isOn ? 'Выключить' : 'Включить нагрев'}</span>
        </button>
      </div>
    </div>
  )
}

// Компоненты для состояния "Не настроен"

interface NotConfiguredProps {
  friendlyName?: string
}

// Compact стиль для "Не настроен"
export const CompactNotConfigured = ({ friendlyName }: NotConfiguredProps) => {
  return (
    <div className="h-full p-3 flex flex-col items-center justify-center overflow-hidden">
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="font-medium text-sm text-white truncate flex-1 mr-2">
          {friendlyName || 'Водонагреватель'}
        </h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-24 h-24 rounded-full bg-dark-bg border-2 border-dashed border-dark-border flex items-center justify-center mb-4">
          <Droplet size={32} className="text-dark-textSecondary" />
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-dark-textSecondary mb-1">
            Не настроен
          </div>
          <div className="text-xs text-dark-textSecondary">
            Настройте в Settings
          </div>
        </div>
      </div>
    </div>
  )
}

// Card стиль для "Не настроен"
export const CardNotConfigured = ({ friendlyName }: NotConfiguredProps) => {
  return (
    <div className="h-full p-4 flex flex-col bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-dark-bg border border-dashed border-dark-border flex items-center justify-center">
          <Droplet size={24} className="text-dark-textSecondary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white">{friendlyName || 'Водонагреватель'}</h3>
          <div className="text-xs text-dark-textSecondary">Не настроен</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-dark-textSecondary mx-auto mb-3 opacity-50" />
          <div className="text-sm text-dark-textSecondary mb-1">
            Устройство не подключено
          </div>
          <div className="text-xs text-dark-textSecondary">
            Перейдите в настройки для подключения
          </div>
        </div>
      </div>
    </div>
  )
}

// Minimal стиль для "Не настроен"
export const MinimalNotConfigured = ({ friendlyName }: NotConfiguredProps) => {
  return (
    <div className="h-full p-4 flex flex-col">
      <div className="mb-4">
        <h3 className="font-medium text-white text-sm mb-1">
          {friendlyName || 'Водонагреватель'}
        </h3>
        <div className="text-xs text-dark-textSecondary">○ Не настроен</div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-dark-bg border border-dashed border-dark-border flex items-center justify-center mx-auto mb-3">
            <Droplet size={28} className="text-dark-textSecondary" />
          </div>
          <div className="text-sm text-dark-textSecondary">
            Настройте устройство
          </div>
        </div>
      </div>
    </div>
  )
}

// Modern стиль для "Не настроен"
export const ModernNotConfigured = ({ friendlyName }: NotConfiguredProps) => {
  return (
    <div className="h-full p-4 flex flex-col rounded-lg border border-dashed border-dark-border bg-dark-card/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{friendlyName || 'Водонагреватель'}</h3>
          <div className="text-xs text-dark-textSecondary mt-0.5">Ожидание настройки</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-dark-bg border border-dashed border-dark-border flex items-center justify-center">
          <Settings size={18} className="text-dark-textSecondary" />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-dark-bg to-dark-card border-2 border-dashed border-dark-border flex items-center justify-center">
            <Droplet size={40} className="text-dark-textSecondary opacity-50" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-dark-textSecondary mb-1">
            Устройство не настроено
          </div>
          <div className="text-xs text-dark-textSecondary">
            Settings → Настройка виджетов
          </div>
        </div>
      </div>
    </div>
  )
}
