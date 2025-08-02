'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, Loader2, ChevronRight, Package } from 'lucide-react'

// デバウンス処理
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
  
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout)
  }
  
  return debounced
}

interface OptimizedDrug {
  id: number
  name: string // 一般名
  brand_name?: string
  brand_manufacturer?: string
  generic_manufacturers: string[]
  dosage_form?: string
  standard?: string
  has_brand: boolean
  manufacturer_count: number
}

interface SmartDrugAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (drug: OptimizedDrug, selectedManufacturer?: string) => void
  placeholder?: string
  className?: string
  showManufacturerSelect?: boolean
}

// キャッシュ
const drugCache = new Map<string, { drugs: OptimizedDrug[], timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10分

export default function SmartDrugAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '薬剤名を入力（2文字以上）',
  className = '',
  showManufacturerSelect = false
}: SmartDrugAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<OptimizedDrug[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [expandedDrugId, setExpandedDrugId] = useState<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController>()

  // キャッシュから取得
  const getCachedResults = (query: string): OptimizedDrug[] | null => {
    const cached = drugCache.get(query.toLowerCase())
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.drugs
    }
    return null
  }

  // キャッシュに保存
  const setCachedResults = (query: string, drugs: OptimizedDrug[]) => {
    drugCache.set(query.toLowerCase(), {
      drugs,
      timestamp: Date.now()
    })
  }

  // 薬剤検索
  const searchDrugs = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    // キャッシュチェック
    const cached = getCachedResults(query)
    if (cached) {
      setSuggestions(cached)
      return
    }

    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/drugs/search-optimized?query=${encodeURIComponent(query)}&limit=10`,
        { signal: abortControllerRef.current.signal }
      )
      
      if (!response.ok) throw new Error('検索失敗')
      
      const data = await response.json()
      
      if (data.success && data.drugs) {
        setCachedResults(query, data.drugs)
        setSuggestions(data.drugs)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('薬剤検索エラー:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // デバウンス処理
  const debouncedSearch = useMemo(
    () => debounce(searchDrugs, 200), // より短く
    [searchDrugs]
  )

  useEffect(() => {
    if (value && value.length >= 2) {
      debouncedSearch(value)
    } else {
      setSuggestions([])
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [value, debouncedSearch])

  // クリック外部の処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setExpandedDrugId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 選択処理
  const handleSelect = (drug: OptimizedDrug, manufacturer?: string) => {
    let selectedName = drug.name

    // メーカー選択時
    if (manufacturer) {
      selectedName = `${drug.name}「${manufacturer}」`
    } else if (drug.has_brand && drug.brand_name) {
      // 先発品選択時
      selectedName = drug.brand_name
    }

    onChange(selectedName)
    if (onSelect) {
      onSelect(drug, manufacturer)
    }
    setShowSuggestions(false)
    setExpandedDrugId(null)
    setSelectedIndex(-1)
  }

  // メーカー展開/折りたたみ
  const toggleManufacturerList = (drugId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedDrugId(expandedDrugId === drugId ? null : drugId)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
          autoComplete="off"
          spellCheck={false}
        />

        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center pr-2">
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 overflow-auto">
          {suggestions.map((drug, index) => (
            <div key={drug.id} className="border-b border-gray-100 last:border-0">
              {/* メイン薬剤情報 */}
              <div
                onClick={() => !showManufacturerSelect && handleSelect(drug)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                  selectedIndex === index ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {drug.name}
                    </div>
                    {drug.dosage_form && (
                      <span className="text-xs text-gray-500">
                        {drug.dosage_form} {drug.standard}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {drug.has_brand && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        先発あり
                      </span>
                    )}
                    
                    {drug.manufacturer_count > 0 && showManufacturerSelect && (
                      <button
                        onClick={(e) => toggleManufacturerList(drug.id, e)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <Package className="h-3 w-3" />
                        {drug.manufacturer_count}社
                        <ChevronRight
                          className={`h-3 w-3 transition-transform ${
                            expandedDrugId === drug.id ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 展開時：メーカー選択 */}
              {showManufacturerSelect && expandedDrugId === drug.id && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {drug.has_brand && drug.brand_name && (
                    <div
                      onClick={() => handleSelect(drug)}
                      className="px-6 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-sm">{drug.brand_name}</span>
                      <span className="text-xs text-purple-600 font-medium">
                        先発品・{drug.brand_manufacturer}
                      </span>
                    </div>
                  )}
                  
                  {drug.generic_manufacturers.map((manufacturer, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelect(drug, manufacturer)}
                      className="px-6 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {drug.name}「{manufacturer}」
                      </span>
                      <span className="text-xs text-green-600">後発品</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSuggestions && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-gray-500">
          該当する薬剤が見つかりません
        </div>
      )}
    </div>
  )
}