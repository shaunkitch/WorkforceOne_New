'use client'

import { useState, useRef, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

interface MultiSelectProps {
  label: string
  required?: boolean
  value?: string[]
  onChange: (value: string[]) => void
  options: string[]
  placeholder?: string
  className?: string
  error?: string
}

export default function MultiSelect({
  label,
  required = false,
  value = [],
  onChange,
  options,
  placeholder = 'Select options...',
  className = '',
  error
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option]
    onChange(newValue)
  }

  const removeOption = (option: string) => {
    onChange(value.filter(v => v !== option))
  }

  const selectAll = () => {
    onChange(filteredOptions)
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-base font-semibold text-gray-800 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-2 text-lg">*</span>}
      </Label>

      <div className="relative" ref={dropdownRef}>
        {/* Main trigger button */}
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-between h-auto min-h-12 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex-1 text-left">
            {value.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1 py-1">
                {value.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {item}
                    <button
                      type="button"
                      className="ml-1 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeOption(item)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </Button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
            {/* Search and controls */}
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Select All ({filteredOptions.length})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-3 p-3 hover:bg-blue-50 cursor-pointer"
                    onClick={() => toggleOption(option)}
                  >
                    <Checkbox
                      checked={value.includes(option)}
                      onChange={() => toggleOption(option)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm flex-1">{option}</span>
                  </div>
                ))
              )}
            </div>

            {/* Footer with count */}
            {value.length > 0 && (
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-600 text-center">
                  {value.length} of {options.length} selected
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}