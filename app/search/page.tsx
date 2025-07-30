'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Clock, Phone, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/google-maps/geocoding'

type PharmacyResult = {
  id: string
  name: string
  address: string
  phone: string
  distance_km: string
  twenty_four_support: boolean
  holiday_support: boolean
  current_capacity: number
  max_capacity: number
  lat: number
  lng: number
}

export default function SearchPage() {
  const [searchAddress, setSearchAddress] = useState('')
  const [searchResults, setSearchResults] = useState<PharmacyResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchAddress.trim()) return

    setIsSearching(true)
    setError(null)
    
    try {
      // Google Maps Geocoding APIを使用して住所から座標を取得
      const coordinates = await geocodeAddress(searchAddress)
      
      if (!coordinates) {
        setError('住所から位置情報を取得できませんでした。正しい住所を入力してください。')
        setIsSearching(false)
        return
      }
      
      const { lat, lng } = coordinates

      // 検索ログを記録
      const supabase = createClient()
      await supabase
        .from('search_logs')
        .insert({
          search_address: searchAddress,
          search_location: `POINT(${lng} ${lat})`,
          search_filters: { radius: 5 },
        })

      // 薬局を検索
      const response = await fetch(`/api/pharmacies/search?lat=${lat}&lng=${lng}&radius=5`)
      
      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }

      const data = await response.json()
      setSearchResults(data.pharmacies || [])
    } catch (err) {
      setError('検索中にエラーが発生しました')
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">薬局検索</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              患者様の住所を入力してください
            </label>
            <div className="flex gap-2">
              <input
                id="address"
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="例: 東京都新宿区西新宿1-1-1"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                検索
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isSearching && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">検索中...</p>
          </div>
        )}

        {searchResults.length > 0 && !isSearching && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              検索結果: {searchResults.length}件
            </h2>
            
            {searchResults.map((pharmacy) => (
              <div key={pharmacy.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {pharmacy.name}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {pharmacy.address}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {pharmacy.distance_km}km
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {pharmacy.twenty_four_support && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      <Clock className="w-3 h-3" />
                      24時間対応
                    </span>
                  )}
                  {pharmacy.holiday_support && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      休日対応
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    受入可能: {pharmacy.maxCapacity - pharmacy.currentCapacity}名
                    （現在 {pharmacy.currentCapacity}/{pharmacy.maxCapacity}名）
                  </div>
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    電話する
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && !isSearching && searchAddress && (
          <div className="text-center py-8">
            <p className="text-gray-600">
              該当する薬局が見つかりませんでした。
              <br />
              別の住所で検索してみてください。
            </p>
          </div>
        )}
      </main>
    </div>
  )
}