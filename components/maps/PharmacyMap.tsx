'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface PharmacyMapProps {
  center: { lat: number; lng: number }
  pharmacies: Array<{
    id: string
    name: string
    address: string
    lat: number
    lng: number
    distance_km: string
    available_spots: number
    twenty_four_support?: boolean
    has_clean_room?: boolean
    handles_narcotics?: boolean
  }>
  onMarkerClick: (pharmacyId: string) => void
  selectedPharmacyId?: string | null
  zoom?: number // ズームレベルを追加
}

export default function PharmacyMap({ 
  center, 
  pharmacies, 
  onMarkerClick,
  selectedPharmacyId,
  zoom = 11 // デフォルトは16km表示のズームレベル
}: PharmacyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<Map<string, google.maps.Marker>>(new Map())
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)

  // マップの初期化
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
      language: 'ja',
    })

    loader.load().then(() => {
      if (mapRef.current && !map) {
        const googleMap = new google.maps.Map(mapRef.current, {
          center,
          zoom: zoom,
          styles: [
            {
              featureType: 'poi.business',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        })
        
        setMap(googleMap)
        setInfoWindow(new google.maps.InfoWindow())
      }
    })
  }, [zoom])

  // 中心位置の更新
  useEffect(() => {
    if (map && center) {
      map.setCenter(center)
      
      // 患者位置にマーカーを追加
      new google.maps.Marker({
        position: center,
        map,
        title: '検索地点',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })
    }
  }, [map, center])

  // 薬局マーカーの更新
  useEffect(() => {
    if (!map) return

    // 既存のマーカーをクリア
    markers.forEach(marker => marker.setMap(null))
    const newMarkers = new Map<string, google.maps.Marker>()

    // 新しいマーカーを追加
    pharmacies.forEach(pharmacy => {
      // マーカーの色を条件によって変更
      let markerColor = '#EA4335' // デフォルト赤
      if (pharmacy.available_spots === 0) {
        markerColor = '#9E9E9E' // 満床はグレー
      } else if (pharmacy.twenty_four_support) {
        markerColor = '#34A853' // 24時間対応は緑
      } else if (pharmacy.available_spots > 5) {
        markerColor = '#FBBC04' // 空きが多い場合は黄色
      }

      const marker = new google.maps.Marker({
        position: { lat: pharmacy.lat, lng: pharmacy.lng },
        map,
        title: pharmacy.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: 180,
        },
      })

      // クリックイベント
      marker.addListener('click', () => {
        if (infoWindow) {
          const content = `
            <div style="font-family: sans-serif; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${pharmacy.name}</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #666;">${pharmacy.address}</p>
              <p style="margin: 4px 0; font-size: 14px;">
                <strong>距離:</strong> ${pharmacy.distance_km}km
              </p>
              <p style="margin: 4px 0; font-size: 14px;">
                <strong>空き:</strong> ${pharmacy.available_spots}名
              </p>
              ${pharmacy.twenty_four_support ? '<p style="margin: 4px 0; font-size: 12px; color: #34A853;">✓ 24時間対応</p>' : ''}
              ${pharmacy.has_clean_room ? '<p style="margin: 4px 0; font-size: 12px; color: #673AB7;">✓ 無菌室あり</p>' : ''}
              ${pharmacy.handles_narcotics ? '<p style="margin: 4px 0; font-size: 12px; color: #FF5722;">✓ 麻薬取扱い</p>' : ''}
            </div>
          `
          infoWindow.setContent(content)
          infoWindow.open(map, marker)
        }
        onMarkerClick(pharmacy.id)
      })

      newMarkers.set(pharmacy.id, marker)
    })

    setMarkers(newMarkers)

    // 選択された薬局にフォーカス
    if (selectedPharmacyId && newMarkers.has(selectedPharmacyId)) {
      const selectedMarker = newMarkers.get(selectedPharmacyId)!
      map.panTo(selectedMarker.getPosition()!)
      google.maps.event.trigger(selectedMarker, 'click')
    }
  }, [map, pharmacies, selectedPharmacyId, onMarkerClick, infoWindow])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-md" />
      
      {/* マップの凡例 */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs">
        <p className="font-semibold mb-2">凡例</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>検索地点</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>24時間対応</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>空きあり（5名以上）</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>空きあり</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span>満床</span>
          </div>
        </div>
      </div>
    </div>
  )
}