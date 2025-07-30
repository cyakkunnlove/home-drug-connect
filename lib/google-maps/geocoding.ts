// Geocoding結果の型定義
export interface GeocodingResult {
  lat: number
  lng: number
  formattedAddress: string
  prefecture?: string
  city?: string
  postalCode?: string
}

// Google Maps Geocoding APIを使用して住所から座標を取得
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error('Google Maps APIキーが設定されていません')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}&language=ja&region=jp&components=country:JP`
    )

    if (!response.ok) {
      throw new Error('Geocoding APIエラー')
    }

    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location
      
      // 住所コンポーネントから詳細情報を抽出
      let prefecture = ''
      let city = ''
      let postalCode = ''
      
      for (const component of result.address_components) {
        if (component.types.includes('administrative_area_level_1')) {
          prefecture = component.long_name
        }
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
          city = component.long_name
        }
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name
        }
      }
      
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        prefecture,
        city,
        postalCode,
      }
    }

    console.error('住所が見つかりません:', data.status)
    return null
  } catch (error) {
    console.error('Geocoding エラー:', error)
    return null
  }
}

// 2つの座標間の距離を計算（km）
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // 地球の半径（km）
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10 // 小数点1位まで
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}