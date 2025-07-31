'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  Filter,
  Shield,
  Users,
  Map,
  List,
  Navigation,
  X,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/google-maps/geocoding'
import { useRouter } from 'next/navigation'
import TouchFeedback, { IOSButton } from '@/components/ui/TouchFeedback'
import { motion, AnimatePresence } from 'framer-motion'

// Google Mapsコンポーネントを動的インポート（SSR対策）
const PharmacyMap = dynamic(
  () => import('@/components/maps/PharmacyMap'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
  }
)

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

export default function SearchPageMobile() {
  const router = useRouter()
  const [searchAddress, setSearchAddress] = useState('')
  const [searchResults, setSearchResults] = useState<PharmacyResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null)
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  // フィルター状態
  const [filters, setFilters] = useState({
    excludeFull: true,
    showOnly24Hour: false,
    showOnlyCleanRoom: false,
    showOnlyNarcotics: false,
    radius: 5
  })
  
  // ユーザーの役割を確認
  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setUserRole(userData.role)
        }
      }
    }
    
    checkUserRole()
  }, [])
  
  // 現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      setCurrentLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter({ lat: latitude, lng: longitude })
          
          // 現在地から薬局を検索
          try {
            const params = new URLSearchParams({
              lat: latitude.toString(),
              lng: longitude.toString(),
              radius: filters.radius.toString(),
              excludeFull: filters.excludeFull.toString()
            })
            
            const response = await fetch(`/api/pharmacies/search?${params}`)
            
            if (response.ok) {
              const data = await response.json()
              setSearchResults(data.pharmacies || [])
            }
          } catch (err) {
            console.error('現在地からの検索エラー:', err)
          } finally {
            setCurrentLocationLoading(false)
          }
        },
        (error) => {
          console.error('位置情報の取得エラー:', error)
          setCurrentLocationLoading(false)
          // デフォルトの位置（東京駅）を設定
          setMapCenter({ lat: 35.6812, lng: 139.7671 })
        }
      )
    }
  }, [])
  
  // 現在地から検索する関数
  const searchFromCurrentLocation = () => {
    if (navigator.geolocation) {
      setCurrentLocationLoading(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter({ lat: latitude, lng: longitude })
          setSearchAddress('現在地')
          
          // 検索実行
          await performSearch(latitude, longitude)
          setCurrentLocationLoading(false)
        },
        (error) => {
          setError('位置情報を取得できませんでした')
          setCurrentLocationLoading(false)
        }
      )
    }
  }

  const performSearch = async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: filters.radius.toString(),
        excludeFull: filters.excludeFull.toString()
      })
      
      const requiredServices = []
      if (filters.showOnly24Hour) requiredServices.push('24時間対応')
      if (filters.showOnlyCleanRoom) requiredServices.push('無菌調剤')
      if (filters.showOnlyNarcotics) requiredServices.push('麻薬調剤')
      
      requiredServices.forEach(service => {
        params.append('services', service)
      })
      
      const response = await fetch(`/api/pharmacies/search?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.pharmacies || [])
      }
    } catch (err) {
      setError('検索に失敗しました')
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchAddress.trim()) return

    setIsSearching(true)
    setError(null)
    
    try {
      const geocodingResult = await geocodeAddress(searchAddress)
      
      if (!geocodingResult) {
        setError('住所から位置情報を取得できませんでした')
        setIsSearching(false)
        return
      }
      
      const { lat, lng } = geocodingResult
      setMapCenter({ lat, lng })
      await performSearch(lat, lng)
    } catch (err) {
      setError('検索中にエラーが発生しました')
    } finally {
      setIsSearching(false)
    }
  }

  const PharmacyCard = ({ pharmacy }: { pharmacy: PharmacyResult }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <TouchFeedback
        onTap={() => router.push(`/pharmacy/${pharmacy.id}`)}
        className="p-4"
        hapticFeedback="light"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base truncate">
                {pharmacy.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{pharmacy.formatted_address || pharmacy.address}</span>
              </p>
            </div>
            <span className="ml-2 text-sm font-medium text-blue-600 flex-shrink-0">
              {pharmacy.distance_km}km
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {pharmacy.twenty_four_support && (
              <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                <Clock className="w-3 h-3 mr-0.5" />
                24h
              </span>
            )}
            {pharmacy.has_clean_room && (
              <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                <Shield className="w-3 h-3 mr-0.5" />
                無菌
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
              <Users className="w-3 h-3 mr-0.5" />
              {pharmacy.available_spots}名可
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <TouchFeedback
              onTap={() => router.push(`/pharmacy/${pharmacy.id}`)}
              className="flex-1 py-2.5 px-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium text-center"
              hapticFeedback="light"
            >
              詳細を見る
            </TouchFeedback>
            {userRole === 'doctor' && (
              <TouchFeedback
                onTap={() => router.push(`/doctor/request/new?pharmacyId=${pharmacy.id}`)}
                className="flex-1 py-2.5 px-3 bg-blue-600 text-white rounded-xl text-sm font-medium text-center"
                hapticFeedback="medium"
              >
                依頼作成
              </TouchFeedback>
            )}
          </div>
        </div>
      </TouchFeedback>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">薬局検索</h1>
            <div className="flex items-center gap-2">
              <TouchFeedback
                onTap={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className="p-2.5 rounded-xl bg-gray-100"
                hapticFeedback="light"
              >
                {viewMode === 'map' ? <List className="w-5 h-5" /> : <Map className="w-5 h-5" />}
              </TouchFeedback>
              <TouchFeedback
                onTap={() => setShowFilterModal(true)}
                className="p-2.5 rounded-xl bg-gray-100 relative"
                hapticFeedback="light"
              >
                <Filter className="w-5 h-5" />
                {(filters.showOnly24Hour || filters.showOnlyCleanRoom || filters.showOnlyNarcotics) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </TouchFeedback>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b px-4 py-3">
        <form onSubmit={handleSearch} className="space-y-3">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="住所を入力（例: 新宿区西新宿）"
            className="w-full px-4 py-3 bg-gray-100 rounded-xl text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <TouchFeedback
              onTap={searchFromCurrentLocation}
              disabled={currentLocationLoading || isSearching}
              className="flex-1 py-3 bg-gray-100 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              hapticFeedback="light"
            >
              <Navigation className="w-5 h-5" />
              <span className="font-medium">現在地から検索</span>
            </TouchFeedback>
            <IOSButton
              variant="primary"
              size="large"
              onTap={() => handleSearch({ preventDefault: () => {} } as React.FormEvent)}
              disabled={isSearching || currentLocationLoading || !searchAddress.trim()}
              className="flex-1"
            >
              <Search className="w-5 h-5 mr-2" />
              検索
            </IOSButton>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {isSearching || currentLocationLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-gray-600">
                {currentLocationLoading ? '現在地を取得中...' : '検索中...'}
              </p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="h-[calc(100vh-200px)]">
            {viewMode === 'map' ? (
              /* Map View */
              <div className="h-full relative">
                {mapCenter && (
                  <PharmacyMap
                    center={mapCenter}
                    pharmacies={searchResults}
                    onMarkerClick={(id) => {
                      const pharmacy = searchResults.find(p => p.id === id)
                      if (pharmacy) {
                        router.push(`/pharmacy/${pharmacy.id}`)
                      }
                    }}
                    selectedPharmacyId={selectedPharmacyId}
                    onRequestClick={(pharmacyId) => {
                      if (userRole === 'doctor') {
                        router.push(`/doctor/request/new?pharmacyId=${pharmacyId}`)
                      }
                    }}
                    currentUserRole={userRole}
                  />
                )}
                {/* Bottom Sheet with Results */}
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg max-h-[40vh] overflow-y-auto">
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2"></div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      {searchResults.length}件の薬局が見つかりました
                    </p>
                    <div className="space-y-3">
                      {searchResults.slice(0, 3).map((pharmacy) => (
                        <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
                      ))}
                    </div>
                    {searchResults.length > 3 && (
                      <TouchFeedback
                        onTap={() => setViewMode('list')}
                        className="mt-4 w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-center font-medium"
                        hapticFeedback="light"
                      >
                        すべて見る ({searchResults.length}件)
                      </TouchFeedback>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* List View */
              <div className="px-4 py-4 space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  {searchResults.length}件の薬局が見つかりました
                </p>
                {searchResults.map((pharmacy) => (
                  <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
                ))}
              </div>
            )}
          </div>
        ) : searchAddress && !isSearching ? (
          <div className="flex items-center justify-center h-64 px-8">
            <div className="text-center">
              <p className="text-gray-600">
                該当する薬局が見つかりませんでした
              </p>
              <p className="text-sm text-gray-500 mt-2">
                フィルターを調整するか、別の住所で検索してください
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowFilterModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">フィルター</h2>
                  <TouchFeedback
                    onTap={() => setShowFilterModal(false)}
                    className="p-2 -m-2"
                    hapticFeedback="light"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </TouchFeedback>
                </div>

                <div className="space-y-6">
                  {/* Distance */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      検索範囲
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 5, 10, 20].map((km) => (
                        <TouchFeedback
                          key={km}
                          onTap={() => setFilters({ ...filters, radius: km })}
                          className={`py-2 px-3 rounded-xl text-sm font-medium text-center ${
                            filters.radius === km
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                          hapticFeedback="light"
                        >
                          {km}km
                        </TouchFeedback>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="flex items-center justify-between py-3">
                      <span className="text-gray-700">満床の薬局を除外</span>
                      <input
                        type="checkbox"
                        checked={filters.excludeFull}
                        onChange={(e) => setFilters({ ...filters, excludeFull: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between py-3">
                      <span className="text-gray-700">24時間対応</span>
                      <input
                        type="checkbox"
                        checked={filters.showOnly24Hour}
                        onChange={(e) => setFilters({ ...filters, showOnly24Hour: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between py-3">
                      <span className="text-gray-700">無菌調剤室あり</span>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyCleanRoom}
                        onChange={(e) => setFilters({ ...filters, showOnlyCleanRoom: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between py-3">
                      <span className="text-gray-700">麻薬取扱い可能</span>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyNarcotics}
                        onChange={(e) => setFilters({ ...filters, showOnlyNarcotics: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                  </div>
                </div>

                <IOSButton
                  variant="primary"
                  size="large"
                  onTap={() => {
                    setShowFilterModal(false)
                    if (mapCenter) {
                      performSearch(mapCenter.lat, mapCenter.lng)
                    }
                  }}
                  className="w-full mt-6"
                >
                  フィルターを適用
                </IOSButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}