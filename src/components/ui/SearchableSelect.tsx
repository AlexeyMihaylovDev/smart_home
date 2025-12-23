import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, X } from 'lucide-react'

interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className = '',
  disabled = false
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target)
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target)

      // Only close if click is outside BOTH container and dropdown
      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })

      // Фокус на поле поиска при открытии
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 0)
    } else {
      setSearchTerm('')
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      className="absolute z-[9999] bg-dark-card border border-dark-border rounded-lg shadow-lg overflow-hidden flex flex-col"
      style={{
        top: coords.top + 4,
        left: coords.left,
        width: coords.width,
        maxHeight: '300px'
      }}
    >
      {/* Поле поиска */}
      <div className="p-2 border-b border-dark-border flex-shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-dark-textSecondary" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-dark-bg border border-dark-border rounded px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Список опций */}
      <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 custom-scrollbar">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-right px-3 py-2 text-sm hover:bg-dark-cardHover transition-colors whitespace-nowrap block ${value === option.value ? 'bg-blue-600 bg-opacity-20 text-blue-400' : 'text-white'
                }`}
            >
              {option.label}
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-dark-textSecondary text-center">
            לא נמצא כלום
          </div>
        )}
      </div>
    </div>
  ) : null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2">
          <ChevronDown size={16} className={`text-dark-textSecondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          {value && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-dark-cardHover rounded transition-colors"
              title="נקה"
            >
              <X size={14} className="text-dark-textSecondary" />
            </button>
          )}
        </div>
        <span className={`block truncate ${value ? 'text-white' : 'text-dark-textSecondary'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      {isOpen && createPortal(dropdown, document.body)}
    </div>
  )
}

export default SearchableSelect

