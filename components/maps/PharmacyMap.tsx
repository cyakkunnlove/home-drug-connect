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
  onDetailClick?: (pharmacyId: string) => void // 詳細ボタンのコールバック
  currentUserRole?: string | null // 現在のユーザーロール
}

export default function PharmacyMap({ 
  center, 
  pharmacies, 
  onMarkerClick,
  selectedPharmacyId,
  zoom = 11, // デフォルトは16km表示のズームレベル
  onRequestClick,
  onDetailClick,
  currentUserRole
}: PharmacyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<Map<string, google.maps.Marker>>(new Map())
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  // マップの初期化
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.error('Google Maps APIキーが設定されていません')
      setMapError('Google Maps APIキーが設定されていません')
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
      language: 'ja',
    })

    loader.load()
      .then(() => {
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
      .catch((error) => {
        console.error('Google Maps 読み込みエラー:', error)
        setMapError('Google Maps の読み込みに失敗しました')
      })
  }, [zoom])

  // 中心位置とズームレベルの更新
  useEffect(() => {
    if (map && center) {
      map.setCenter(center)
      map.setZoom(zoom)
      
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
  }, [map, center, zoom])

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

      // 機能を表示するアイコンを作成
      const features = []
      if (pharmacy.twenty_four_support) features.push('24')
      if (pharmacy.has_clean_room) features.push('C')
      if (pharmacy.handles_narcotics) features.push('N')
      
      const marker = new google.maps.Marker({
        position: { lat: pharmacy.lat, lng: pharmacy.lng },
        map,
        title: pharmacy.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
              <!-- メインのピンマーカー -->
              <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="${markerColor}" stroke="white" stroke-width="2"/>
              <!-- 中央の円 -->
              <circle cx="20" cy="18" r="14" fill="white" opacity="0.9"/>
              <!-- テキスト -->
              <text x="20" y="${features.length > 0 ? '23' : '25'}" text-anchor="middle" font-family="sans-serif" font-size="${features.length > 2 ? '10' : '12'}" font-weight="bold" fill="${markerColor}">
                ${features.length > 0 ? features.join('･') : '薬'}
              </text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50),
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
                <button
                  onclick="window.dispatchEvent(new CustomEvent('pharmacyDetailClick', { detail: { pharmacyId: '${pharmacy.id}' } }))"
                  style="flex: 1; background-color: #F3F4F6; color: #1F2937; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;"
                  onmouseover="this.style.backgroundColor='#E5E7EB'"
                  onmouseout="this.style.backgroundColor='#F3F4F6'"
                >
                  詳細を見る
                </button>
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

    const handleDetailClick = (event: any) => {
      const pharmacyId = event.detail.pharmacyId
      if (onDetailClick && pharmacyId) {
        onDetailClick(pharmacyId)
      }
    }

    window.addEventListener('pharmacyRequestClick', handleRequestClick)
    window.addEventListener('pharmacyDetailClick', handleDetailClick)
    
    return () => {
      window.removeEventListener('pharmacyRequestClick', handleRequestClick)
      window.removeEventListener('pharmacyDetailClick', handleDetailClick)
    }
  }, [onRequestClick, onDetailClick])

  return (
    <div className="relative w-full h-full">
      {mapError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">{mapError}</p>
            <p className="text-gray-500 text-xs mt-2">管理者に問い合わせてください</p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full rounded-lg shadow-md" />
      )}
      
      {/* マップの凡例 */}
      {!mapError && (
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white rounded-lg shadow-lg p-3 sm:p-4 text-xs sm:text-sm border border-gray-200 max-w-[220px] sm:max-w-[250px]">
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
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 font-semibold mb-1">マーカー色</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <svg width="16" height="20" viewBox="0 0 40 50" className="flex-shrink-0">
                  <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="#34A853"/>
                </svg>
                <span className="text-gray-700">24時間対応</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="20" viewBox="0 0 40 50" className="flex-shrink-0">
                  <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="#FBBC04"/>
                </svg>
                <span className="text-gray-700">空き多数</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="20" viewBox="0 0 40 50" className="flex-shrink-0">
                  <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="#EA4335"/>
                </svg>
                <span className="text-gray-700">空きあり</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="20" viewBox="0 0 40 50" className="flex-shrink-0">
                  <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="#9E9E9E"/>
                </svg>
                <span className="text-gray-500">満床</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 font-semibold mb-1">機能表示</div>
            <div className="space-y-0.5 text-xs">
              <div><span className="font-bold text-gray-700">24</span> = 24時間対応</div>
              <div><span className="font-bold text-gray-700">C</span> = 無菌室あり</div>
              <div><span className="font-bold text-gray-700">N</span> = 麻薬取扱い</div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}