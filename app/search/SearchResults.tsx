'use client'

import { useState } from 'react'
import { MapPin, Clock, Phone } from 'lucide-react'
import GoogleMap from '@/components/maps/GoogleMap'

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
  const [showMap, setShowMap] = useState(true)

  const mapMarkers = results.map(pharmacy => ({
    id: pharmacy.id,
    position: { lat: pharmacy.lat, lng: pharmacy.lng },
    title: pharmacy.name,
    info: `${pharmacy.address} (${pharmacy.distance_km}km)`,
  }))

  const mapCenter = searchLocation || 
    (results.length > 0 
      ? { lat: results[0].lat, lng: results[0].lng }
      : { lat: 35.6762, lng: 139.6503 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          検索結果: {results.length}件
        </h2>
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showMap ? '地図を隠す' : '地図を表示'}
        </button>
      </div>

      {showMap && results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <GoogleMap
            center={mapCenter}
            markers={mapMarkers}
            className="w-full h-96"
          />
        </div>
      )}

      <div className="space-y-4">
        {results.map((pharmacy) => (
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
                受入可能: {pharmacy.max_capacity - pharmacy.current_capacity}名
                （現在 {pharmacy.current_capacity}/{pharmacy.max_capacity}名）
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
    </div>
  )
}