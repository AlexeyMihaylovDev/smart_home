interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

const ToggleSwitch = ({ checked, onChange, disabled = false }: ToggleSwitchProps) => {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out
        h-8 w-14
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg
        ${disabled
          ? 'bg-gray-700 cursor-not-allowed opacity-50'
          : checked
            ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
            : 'bg-gray-600 hover:bg-gray-500 focus:ring-gray-500'
        }
      `}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={`
          inline-block transform rounded-full bg-white transition-transform duration-200 ease-in-out
          shadow-lg border-2 border-gray-100
          h-6 w-6
          ${checked ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  )
}

export default ToggleSwitch


