'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Drug {
  code: string
  name: string
  name_kana?: string
  type: 'generic' | 'brand'
  similarity?: number
}

interface DrugAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (drug: Drug) => void
  placeholder?: string
  className?: string
}

export default function DrugAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '薬剤名を入力',
  className = ''
}: DrugAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Drug[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Search drugs from API
  const searchDrugs = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/drugs/search?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.drugs || [])
      }
    } catch (error) {
      console.error('Error searching drugs:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (value) {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        searchDrugs(value)
      }, 300)
    } else {
      setSuggestions([])
    }

    return () => clearTimeout(debounceRef.current)
  }, [value])

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelect = (drug: Drug) => {
    onChange(drug.name)
    onSelect(drug)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowSuggestions(true)
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            setSuggestions([])
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500">検索中...</div>
          ) : (
            suggestions.map((drug, index) => (
              <div
                key={drug.code}
                onClick={() => handleSelect(drug)}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                  index === selectedIndex
                    ? 'text-white bg-blue-600'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`block truncate ${
                    index === selectedIndex ? 'font-semibold' : 'font-normal'
                  }`}>
                    {drug.name}
                  </span>
                  <span className={`ml-2 text-xs ${
                    index === selectedIndex ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {drug.type === 'brand' ? '先発品' : '後発品'}
                  </span>
                </div>
                {drug.name_kana && (
                  <span className={`block text-xs ${
                    index === selectedIndex ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {drug.name_kana}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}