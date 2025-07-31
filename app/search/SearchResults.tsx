'use client'

import { useState, useMemo, useCallback } from 'react'
import { MapPin, Clock, Phone, Grid, List, Map as MapIcon } from 'lucide-react'
import GoogleMap from '@/components/maps/GoogleMap'
import { VirtualPharmacyList } from '@/components/ui/VirtualList'
import { useSearchStore, useSearchUI, useSearchResults } from '@/lib/state/search-store'

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

type SearchResultsProps = {
  results: PharmacyResult[]
  searchLocation?: { lat: number; lng: number }
}

export default function SearchResults({ results, searchLocation }: SearchResultsProps) {
  // Use global state instead of local state
  const { showMap, viewMode, selectedPharmacy } = useSearchUI()
  const { results: storeResults, totalResults, isLoading, hasNextPage } = useSearchResults()
  const { setShowMap, setViewMode, setSelectedPharmacy, loadMoreResults } = useSearchStore()
  
  // Use store results if available, fallback to props
  const pharmacies = storeResults.length > 0 ? storeResults : results

  // Memoize map markers for performance
  const mapMarkers = useMemo(() => 
    pharmacies.map(pharmacy => ({
      id: pharmacy.id,
      position: { lat: pharmacy.lat, lng: pharmacy.lng },
      title: pharmacy.name,
      info: `${pharmacy.address} (${pharmacy.distance_km}km)`,
    })), [pharmacies]
  )

  // Memoize map center
  const mapCenter = useMemo(() => 
    searchLocation || 
    (pharmacies.length > 0 
      ? { lat: pharmacies[0].lat, lng: pharmacies[0].lng }
      : { lat: 35.6762, lng: 139.6503 }), [searchLocation, pharmacies]
  )

  // Optimized pharmacy click handler
  const handlePharmacyClick = useCallback((pharmacy: PharmacyResult) => {
    setSelectedPharmacy(pharmacy)
    // Optionally navigate to pharmacy detail page
    // router.push(`/pharmacy/${pharmacy.id}`)
  }, [setSelectedPharmacy])

  // View mode toggle handlers
  const handleViewModeChange = useCallback((mode: 'list' | 'grid' | 'map') => {
    setViewMode(mode)
  }, [setViewMode])

  // Load more handler for infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (!isLoading && hasNextPage) {
      await loadMoreResults()
    }
  }, [isLoading, hasNextPage, loadMoreResults])

  // Grid view component
  const GridView = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pharmacies.map((pharmacy) => (
        <PharmacyCard
          key={pharmacy.id}
          pharmacy={pharmacy}
          onClick={handlePharmacyClick}
          isSelected={selectedPharmacy?.id === pharmacy.id}
        />
      ))}
    </div>
  ), [pharmacies, handlePharmacyClick, selectedPharmacy])

  // List view with virtualization for large datasets
  const ListView = useMemo(() => (
    <VirtualPharmacyList
      pharmacies={pharmacies}
      onPharmacyClick={handlePharmacyClick}
      containerHeight={600}
      itemHeight={180}
    />
  ), [pharmacies, handlePharmacyClick])

  return (
    <div className="space-y-6">
      {/* Header with results count and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            検索結果: {totalResults.toLocaleString()}件
            {isLoading && <span className="text-sm text-gray-500 ml-2">読み込み中...</span>}
          </h2>
          {pharmacies.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              表示中: {pharmacies.length}件
              {hasNextPage && ` （他${totalResults - pharmacies.length}件）`}
            </p>
          )}
        </div>
        
        {/* View controls */}
        <div className="flex items-center gap-2">
          {/* View mode buttons */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="リスト表示"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="グリッド表示"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('map')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="地図表示"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Map toggle for non-map views */}
          {viewMode !== 'map' && (
            <button
              onClick={() => setShowMap(!showMap)}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {showMap ? '地図を隠す' : '地図を表示'}
            </button>
          )}
        </div>
      </div>

      {/* Map display */}
      {(showMap || viewMode === 'map') && pharmacies.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <GoogleMap
            center={mapCenter}
            markers={mapMarkers}
            className="w-full h-96"
            selectedMarkerId={selectedPharmacy?.id}
            onMarkerClick={(markerId) => {
              const pharmacy = pharmacies.find(p => p.id === markerId)
              if (pharmacy) setSelectedPharmacy(pharmacy)
            }}
          />
        </div>
      )}

      {/* Results display based on view mode */}
      {pharmacies.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm">
          {viewMode === 'list' && ListView}
          {viewMode === 'grid' && (
            <div className="p-4">
              {GridView}
              {/* Load more button for grid view */}
              {hasNextPage && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? '読み込み中...' : 'さらに表示'}
                  </button>
                </div>
              )}
            </div>
          )}
          {viewMode === 'map' && (
            <div className="p-4 text-center text-gray-600">
              地図上で薬局を選択してください
            </div>
          )}
        </div>
      ) : !isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <MapPin className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            薬局が見つかりませんでした
          </h3>
          <p className="text-gray-600">
            検索条件を変更して再度お試しください。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Loading skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Optimized pharmacy card component
const PharmacyCard = React.memo<{
  pharmacy: PharmacyResult
  onClick: (pharmacy: PharmacyResult) => void
  isSelected?: boolean
}>(({ pharmacy, onClick, isSelected = false }) => (
  <div 
    className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
      isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
    }`}
    onClick={() => onClick(pharmacy)}
  >
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-gray-900 truncate pr-2">
        {pharmacy.name}
      </h3>
      <span className="text-sm text-gray-500 font-medium flex-shrink-0">
        {pharmacy.distance_km}km
      </span>
    </div>
    
    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
      <MapPin className="w-3 h-3 inline mr-1" />
      {pharmacy.address}
    </p>
    
    <div className="flex flex-wrap gap-1 mb-3">
      {pharmacy.twenty_four_support && (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          24時間
        </span>
      )}
      {pharmacy.holiday_support && (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          休日対応
        </span>
      )}
    </div>
    
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">
        受入: {pharmacy.max_capacity - pharmacy.current_capacity}名
      </span>
      <a
        href={`tel:${pharmacy.phone}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
      >
        <Phone className="w-3 h-3" />
        電話
      </a>
    </div>
  </div>
))

PharmacyCard.displayName = 'PharmacyCard'