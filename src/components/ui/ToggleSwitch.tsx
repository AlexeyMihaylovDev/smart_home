interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

const ToggleSwitch = ({ checked, onChange, disabled = false }: ToggleSwitchProps) => {
  const getBackgroundColor = () => {
    if (disabled) return '#374151' // gray-700
    if (checked) return '#24fb48ff' // Yellow (amber-400)
    return '#4b5563' // gray-600
  }

  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`toggle-switch relative inline-flex h-6 w-11 items-center rounded-full ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  )
}

export default ToggleSwitch


