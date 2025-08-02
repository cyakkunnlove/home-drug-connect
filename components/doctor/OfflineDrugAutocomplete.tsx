'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Loader2, Download, CheckCircle } from 'lucide-react'

interface CompressedDrug {
  id: number
  n: string  // name
  b?: string // brand_name
  g?: string[] // generic_manufacturers
  f?: string // form
  s?: string // standard
}

interface OfflineDrugAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (drug: CompressedDrug, manufacturer?: string) => void
  placeholder?: string
  className?: string
}

// グローバルキャッシュ
let drugDataCache: CompressedDrug[] | null = null
let loadingPromise: Promise<CompressedDrug[]> | null = null

export default function OfflineDrugAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = '薬剤名を入力',
  className = ''
}: OfflineDrugAutocompleteProps) {
  const [drugData, setDrugData] = useState<CompressedDrug[]>([])
  const [suggestions, setSuggestions] = useState<CompressedDrug[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // データのロード
  useEffect(() => {
    loadDrugData()
  }, [])

  const loadDrugData = async () => {
    // 既にロード済み
    if (drugDataCache) {
      setDrugData(drugDataCache)
      setDataLoaded(true)
      return
    }

    // ロード中
    if (loadingPromise) {
      const data = await loadingPromise
      setDrugData(data)
      setDataLoaded(true)
      return
    }

    // 新規ロード
    setIsLoading(true)
    loadingPromise = loadData()
    
    try {
      const data = await loadingPromise
      drugDataCache = data
      setDrugData(data)
      setDataLoaded(true)
    } catch (error) {
      console.error('薬剤データのロードエラー:', error)
    } finally {
      setIsLoading(false)
      loadingPromise = null
    }
  }

  const loadData = async (): Promise<CompressedDrug[]> => {
    // 1. まず頻出薬剤をロード
    try {
      const commonResponse = await fetch('/data/drugs-common.json')
      if (commonResponse.ok) {
        const commonData = await commonResponse.json()
        setDrugData(commonData)
        setDataLoaded(true)
      }
    } catch (e) {
      console.log('頻出薬剤データのロードをスキップ')
    }

    // 2. 完全データをバックグラウンドでロード
    const fullResponse = await fetch('/data/drugs-full.json')
    if (!fullResponse.ok) throw new Error('データロード失敗')
    
    return await fullResponse.json()
  }

  // ローカル検索（高速）
  const searchLocal = useMemo(() => {
    return (query: string, data: CompressedDrug[]): CompressedDrug[] => {
      if (!query || query.length < 2) return []
      
      const lowerQuery = query.toLowerCase()
      const hiraganaQuery = toHiragana(query)
      
      // スコアリングによる検索
      const results = data
        .map(drug => {
          let score = 0
          const nameLower = drug.n.toLowerCase()
          
          // 完全一致
          if (nameLower === lowerQuery) score += 100
          // 前方一致
          else if (nameLower.startsWith(lowerQuery)) score += 50
          // 部分一致
          else if (nameLower.includes(lowerQuery)) score += 20
          
          // ブランド名での一致
          if (drug.b) {
            const brandLower = drug.b.toLowerCase()
            if (brandLower.includes(lowerQuery)) score += 30
          }
          
          // ひらがな検索
          if (nameLower.includes(hiraganaQuery)) score += 10
          
          return { drug, score }
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
        .map(item => item.drug)
      
      return results
    }
  }, [])

  // 検索実行
  useEffect(() => {
    if (!dataLoaded || !drugData.length) return
    
    const results = searchLocal(value, drugData)
    setSuggestions(results)
  }, [value, drugData, dataLoaded, searchLocal])

  // UI処理（クリック外部など）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (drug: CompressedDrug, manufacturer?: string) => {
    let selectedName = drug.n
    
    if (manufacturer) {
      selectedName = `${drug.n}「${manufacturer}」`
    } else if (drug.b) {
      selectedName = drug.b
    }
    
    onChange(selectedName)
    if (onSelect) {
      onSelect(drug, manufacturer)
    }
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
          placeholder={placeholder}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
          {!dataLoaded && isLoading && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>データ読込中</span>
            </div>
          )}
          
          {dataLoaded && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>オフライン対応</span>
            </div>
          )}
          
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setSuggestions([])
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto">
          {suggestions.map((drug, index) => (
            <div
              key={drug.id}
              onClick={() => handleSelect(drug)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-3 py-2 cursor-pointer ${
                selectedIndex === index
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">
                {drug.n}
              </div>
              <div className="text-xs text-gray-500">
                {drug.f && `${drug.f} `}
                {drug.s}
                {drug.b && (
                  <span className="ml-2 text-purple-600">
                    先発: {drug.b}
                  </span>
                )}
                {drug.g && drug.g.length > 0 && (
                  <span className="ml-2 text-green-600">
                    後発{drug.g.length}社
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ひらがな変換
function toHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, match => {
    const chr = match.charCodeAt(0) - 0x60
    return String.fromCharCode(chr)
  })
}