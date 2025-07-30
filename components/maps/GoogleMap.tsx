'use client'

import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

type GoogleMapProps = {
  center: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    id: string
    position: { lat: number; lng: number }
    title: string
    info?: string
  }>
  className?: string
}

export default function GoogleMap({ 
  center, 
  zoom = 14, 
  markers = [], 
  className = 'w-full h-96' 
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places'],
      })

      try {
        const google = await loader.load()
        
        if (mapRef.current && !googleMapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
          })
        }
      } catch (error) {
        console.error('Google Maps読み込みエラー:', error)
      }
    }

    initMap()
  }, [center, zoom])

  useEffect(() => {
    if (googleMapRef.current) {
      // 既存のマーカーをクリア
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []

      // 新しいマーカーを追加
      markers.forEach(markerData => {
        const marker = new google.maps.Marker({
          position: markerData.position,
          map: googleMapRef.current,
          title: markerData.title,
        })

        if (markerData.info) {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold">${markerData.title}</h3>
                <p class="text-sm mt-1">${markerData.info}</p>
              </div>
            `,
          })

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current!, marker)
          })
        }

        markersRef.current.push(marker)
      })
    }
  }, [markers])

  return <div ref={mapRef} className={className} />
}