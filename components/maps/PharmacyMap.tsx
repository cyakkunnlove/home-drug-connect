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
  onRequestClick?: (pharmacyId: string) => void // 依頼ボタンのコールバック
  currentUserRole?: string | null // 現在のユーザーロール
}

export default function PharmacyMap({ 
  center, 
  pharmacies, 
  onMarkerClick,
  selectedPharmacyId,
  zoom = 11, // デフォルトは16km表示のズームレベル
  onRequestClick,
  currentUserRole
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
          // マップコントロールのカスタマイズ
          mapTypeControl: true, // 地図タイプコントロールを表示
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT, // 右上に移動
          },
          streetViewControl: false, // ストリートビューは非表示
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
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
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="20" height="20" fill="${markerColor}" stroke="white" stroke-width="2" transform="rotate(45 15 15)"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15),
        },
      })

      // クリックイベント
      marker.addListener('click', () => {
        if (infoWindow) {
          const showRequestButton = currentUserRole === 'doctor' && pharmacy.available_spots > 0
          const content = `
            <div style="font-family: sans-serif; min-width: 250px;">
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
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <a
                  href="/pharmacy/${pharmacy.id}"
                  style="flex: 1; text-align: center; background-color: #F3F4F6; color: #1F2937; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block;"
                  onmouseover="this.style.backgroundColor='#E5E7EB'"
                  onmouseout="this.style.backgroundColor='#F3F4F6'"
                >
                  詳細を見る
                </a>
                ${showRequestButton ? `
                  <button
                    onclick="window.dispatchEvent(new CustomEvent('pharmacyRequestClick', { detail: { pharmacyId: '${pharmacy.id}' } }))"
                    style="flex: 1; background-color: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;"
                    onmouseover="this.style.backgroundColor='#2563EB'"
                    onmouseout="this.style.backgroundColor='#3B82F6'"
                  >
                    依頼を作成
                  </button>
                ` : ''}
              </div>
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
  }, [map, pharmacies, selectedPharmacyId, onMarkerClick, infoWindow, currentUserRole])

  // カスタムイベントリスナーの設定
  useEffect(() => {
    const handleRequestClick = (event: any) => {
      const pharmacyId = event.detail.pharmacyId
      if (onRequestClick && pharmacyId) {
        onRequestClick(pharmacyId)
      }
    }

    window.addEventListener('pharmacyRequestClick', handleRequestClick)
    return () => {
      window.removeEventListener('pharmacyRequestClick', handleRequestClick)
    }
  }, [onRequestClick])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-md" />
      
      {/* マップの凡例 */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white rounded-lg shadow-lg p-3 sm:p-4 text-xs sm:text-sm border border-gray-200 max-w-[180px] sm:max-w-[200px]">
        <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          マーカーの説明
        </h3>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full"></div>
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-gray-700">検索地点</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-sm transform rotate-45 flex-shrink-0"></div>
            <span className="text-gray-700">24時間対応</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-sm transform rotate-45 flex-shrink-0"></div>
            <span className="text-gray-700">空き多数</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-sm transform rotate-45 flex-shrink-0"></div>
            <span className="text-gray-700">空きあり</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-sm transform rotate-45 flex-shrink-0"></div>
            <span className="text-gray-500">満床</span>
          </div>
        </div>
      </div>
    </div>
  )
}