// Google Maps Geocoding APIを使用して住所から座標を取得
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error('Google Maps APIキーが設定されていません')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}&language=ja`
    )

    if (!response.ok) {
      throw new Error('Geocoding APIエラー')
    }

    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng,
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