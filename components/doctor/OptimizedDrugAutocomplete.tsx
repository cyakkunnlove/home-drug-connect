'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, Loader2 } from 'lucide-react'
// デバウンス処理のヘルパー関数
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

interface Drug {
  code: string
  name: string
  name_kana?: string
  type: 'generic' | 'brand'
  manufacturer?: string
}

interface DrugAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (drug: Drug) => void
  placeholder?: string
  className?: string
  minChars?: number
}

// クライアントサイドキャッシュ
const drugCache = new Map<string, { drugs: Drug[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分

// 頻出薬剤のプリロードキャッシュ
const commonDrugsCache: Drug[] = []

export default function OptimizedDrugAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '薬剤名を入力（2文字以上）',
  className = '',
  minChars = 2
}: DrugAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Drug[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController>()

  // 頻出薬剤をプリロード
  useEffect(() => {
    if (commonDrugsCache.length === 0) {
      fetch('/api/drugs/common')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.drugs) {
            commonDrugsCache.push(...data.drugs)
          }
        })
        .catch(err => console.error('Failed to load common drugs:', err))
    }
  }, [])

  // キャッシュから取得
  const getCachedResults = (query: string): Drug[] | null => {
    const cached = drugCache.get(query.toLowerCase())
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.drugs
    }
    return null
  }

  // キャッシュに保存
  const setCachedResults = (query: string, drugs: Drug[]) => {
    drugCache.set(query.toLowerCase(), {
      drugs,
      timestamp: Date.now()
    })
  }

  // ローカルフィルタリング（頻出薬剤から）
  const filterLocalDrugs = useCallback((query: string): Drug[] => {
    if (!query || query.length < minChars) return []
    
    const lowerQuery = query.toLowerCase()
    const hiraganaQuery = toHiragana(query)
    
    return commonDrugsCache
      .filter(drug => {
        const nameLower = drug.name.toLowerCase()
        const kanaLower = drug.name_kana?.toLowerCase() || ''
        
        return nameLower.includes(lowerQuery) || 
               kanaLower.includes(lowerQuery) ||
               kanaLower.includes(hiraganaQuery)
      })
      .slice(0, 10)
  }, [minChars])

  // 薬剤検索
  const searchDrugs = useCallback(async (query: string) => {
    if (query.length < minChars) {
      setSuggestions([])
      return
    }

    // まずローカルの結果を表示
    const localResults = filterLocalDrugs(query)
    if (localResults.length > 0) {
      setSuggestions(localResults)
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

    // 新しいリクエスト
    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/drugs/search?query=${encodeURIComponent(query)}&limit=20`,
        { signal: abortControllerRef.current.signal }
      )
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      
      if (data.success && data.drugs) {
        setCachedResults(query, data.drugs)
        setSuggestions(data.drugs)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Drug search error:', error)
        // エラー時はローカル結果を維持
      }
    } finally {
      setIsLoading(false)
    }
  }, [minChars, filterLocalDrugs])

  // デバウンス処理
  const debouncedSearch = useMemo(
    () => debounce(searchDrugs, 300),
    [searchDrugs]
  )

  // 値が変更されたときの処理
  useEffect(() => {
    if (value && value.length >= minChars) {
      debouncedSearch(value)
    } else {
      setSuggestions([])
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [value, minChars, debouncedSearch])

  // クリック外部の処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // キーボードナビゲーション
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
          onKeyDown={handleKeyDown}
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
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {suggestions.map((drug, index) => (
            <div
              key={drug.code}
              onClick={() => handleSelect(drug)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                index === selectedIndex
                  ? 'text-white bg-blue-600'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className={`block truncate ${
                    index === selectedIndex ? 'font-semibold' : 'font-normal'
                  }`}>
                    {drug.name}
                  </span>
                  {drug.name_kana && (
                    <span className={`block text-xs mt-0.5 ${
                      index === selectedIndex ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {drug.name_kana}
                    </span>
                  )}
                </div>
                <div className="ml-2 flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    drug.type === 'brand' 
                      ? index === selectedIndex ? 'bg-blue-700 text-blue-100' : 'bg-purple-100 text-purple-700'
                      : index === selectedIndex ? 'bg-blue-700 text-blue-100' : 'bg-green-100 text-green-700'
                  }`}>
                    {drug.type === 'brand' ? '先発' : '後発'}
                  </span>
                </div>
              </div>
              {drug.manufacturer && (
                <span className={`block text-xs mt-0.5 ${
                  index === selectedIndex ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  製造: {drug.manufacturer}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showSuggestions && value.length >= minChars && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-gray-500 ring-1 ring-black ring-opacity-5">
          該当する薬剤が見つかりません
        </div>
      )}
    </div>
  )
}

// ひらがな変換ヘルパー
function toHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, match => {
    const chr = match.charCodeAt(0) - 0x60
    return String.fromCharCode(chr)
  })
}