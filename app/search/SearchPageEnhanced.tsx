'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  ChevronLeft, 
  Filter,
  Pill,
  Shield,
  Users,
  Eye,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/google-maps/geocoding'
import Modal from '@/components/ui/Modal'

type PharmacyResult = {
  id: string
  name: string
  address: string
  formatted_address?: string
  phone: string
  distance_km: string
  twenty_four_support: boolean
  holiday_support: boolean
  emergency_support: boolean
  has_clean_room: boolean
  handles_narcotics: boolean
  current_capacity: number
  max_capacity: number
  available_spots: number
  lat: number
  lng: number
}

export default function SearchPageEnhanced() {
  const [searchAddress, setSearchAddress] = useState('')
  const [searchResults, setSearchResults] = useState<PharmacyResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyResult | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // フィルター状態
  const [filters, setFilters] = useState({
    excludeFull: true,
    showOnly24Hour: false,
    showOnlyCleanRoom: false,
    showOnlyNarcotics: false,
    radius: 5
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchAddress.trim()) return

    setIsSearching(true)
    setError(null)
    
    try {
      // Google Maps Geocoding APIを使用して住所から座標を取得
      const geocodingResult = await geocodeAddress(searchAddress)
      
      if (!geocodingResult) {
        setError('住所から位置情報を取得できませんでした。正しい住所を入力してください。')
        setIsSearching(false)
        return
      }
      
      const { lat, lng } = geocodingResult
      console.log('検索座標:', { lat, lng, address: searchAddress })

      // 検索ログを記録
      const supabase = createClient()
      await supabase
        .from('search_logs')
        .insert({
          search_address: searchAddress,
          search_location: `POINT(${lng} ${lat})`,
          search_filters: filters,
        })

      // 薬局を検索（フィルター付き）
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: filters.radius.toString(),
        excludeFull: filters.excludeFull.toString()
      })
      
      // 必要なサービスのフィルター
      const requiredServices = []
      if (filters.showOnly24Hour) requiredServices.push('24時間対応')
      if (filters.showOnlyCleanRoom) requiredServices.push('無菌調剤')
      if (filters.showOnlyNarcotics) requiredServices.push('麻薬調剤')
      
      requiredServices.forEach(service => {
        params.append('services', service)
      })

      const response = await fetch(`/api/pharmacies/search?${params}`)
      
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

  const handlePharmacyClick = (pharmacy: PharmacyResult) => {
    setSelectedPharmacy(pharmacy)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">薬局検索</h1>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              フィルター
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* フィルターパネル */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">検索フィルター</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  検索範囲
                </label>
                <select
                  value={filters.radius}
                  onChange={(e) => setFilters({...filters, radius: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="3">3km以内</option>
                  <option value="5">5km以内</option>
                  <option value="10">10km以内</option>
                  <option value="20">20km以内</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.excludeFull}
                    onChange={(e) => setFilters({...filters, excludeFull: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">満床の薬局を除外</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showOnly24Hour}
                    onChange={(e) => setFilters({...filters, showOnly24Hour: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">24時間対応のみ</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showOnlyCleanRoom}
                    onChange={(e) => setFilters({...filters, showOnlyCleanRoom: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">無菌調剤室ありのみ</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showOnlyNarcotics}
                    onChange={(e) => setFilters({...filters, showOnlyNarcotics: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">麻薬取扱い可能のみ</span>
                </label>
              </div>
            </div>
          </div>
        )}

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
                      {pharmacy.formatted_address || pharmacy.address}
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
                  {pharmacy.has_clean_room && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      <Shield className="w-3 h-3" />
                      無菌室あり
                    </span>
                  )}
                  {pharmacy.handles_narcotics && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      <Pill className="w-3 h-3" />
                      麻薬取扱い
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      <Users className="inline w-4 h-4 mr-1" />
                      受入可能: {pharmacy.available_spots || 0}名
                      （{pharmacy.current_capacity || 0}/{pharmacy.max_capacity || 10}名）
                    </div>
                    <button
                      onClick={() => handlePharmacyClick(pharmacy)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      詳細を見る
                    </button>
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
              フィルターを調整するか、別の住所で検索してみてください。
            </p>
          </div>
        )}
      </main>

      {/* 薬局詳細モーダル */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedPharmacy?.name}
        size="lg"
      >
        {selectedPharmacy && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">基本情報</h4>
              <p className="text-gray-600">
                <MapPin className="inline w-4 h-4 mr-1" />
                {selectedPharmacy.formatted_address || selectedPharmacy.address}
              </p>
              <p className="text-gray-600">
                <Phone className="inline w-4 h-4 mr-1" />
                {selectedPharmacy.phone}
              </p>
              <p className="text-gray-600">
                距離: {selectedPharmacy.distance_km}km
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">対応可能サービス</h4>
              <div className="space-y-1">
                {selectedPharmacy.twenty_four_support && (
                  <p className="text-gray-600">✓ 24時間対応</p>
                )}
                {selectedPharmacy.holiday_support && (
                  <p className="text-gray-600">✓ 休日対応</p>
                )}
                {selectedPharmacy.emergency_support && (
                  <p className="text-gray-600">✓ 緊急対応</p>
                )}
                {selectedPharmacy.has_clean_room && (
                  <p className="text-gray-600">✓ 無菌調剤室あり</p>
                )}
                {selectedPharmacy.handles_narcotics && (
                  <p className="text-gray-600">✓ 麻薬取扱い可能</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">受入状況</h4>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-lg font-semibold text-gray-900">
                  残り {selectedPharmacy.available_spots || 0} 名受入可能
                </p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${((selectedPharmacy.current_capacity || 0) / (selectedPharmacy.max_capacity || 10)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  現在 {selectedPharmacy.current_capacity || 0} / {selectedPharmacy.max_capacity || 10} 名
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href={`/pharmacy/${selectedPharmacy.id}`}
                className="flex-1 text-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                詳細ページへ
              </Link>
              <a
                href={`tel:${selectedPharmacy.phone}`}
                className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                電話で問い合わせる
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}