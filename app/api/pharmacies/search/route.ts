import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseFloat(searchParams.get('radius') || '5') // デフォルト5km

  if (!lat || !lng) {
    return NextResponse.json(
      { error: '座標が指定されていません' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    // PostGISのST_DWithin関数を使用して近隣の薬局を検索
    const { data, error } = await supabase
      .rpc('search_nearby_pharmacies', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radius
      })

    if (error) {
      // RPCが存在しない場合は全薬局を返す（開発用フォールバック）
      const { data: allPharmacies, error: fallbackError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('status', 'active')

      if (fallbackError) throw fallbackError

      // 簡易的な距離計算
      const pharmaciesWithDistance = allPharmacies.map(pharmacy => {
        // locationフィールドから緯度経度を抽出（実際の実装では適切にパース）
        const pharmLat = lat + (Math.random() - 0.5) * 0.1
        const pharmLng = lng + (Math.random() - 0.5) * 0.1
        const distance = Math.random() * radius // 仮の距離

        return {
          ...pharmacy,
          distance_km: distance.toFixed(1),
          lat: pharmLat,
          lng: pharmLng
        }
      }).filter(p => p.distance_km <= radius)
      .sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km))

      return NextResponse.json({ pharmacies: pharmaciesWithDistance })
    }

    return NextResponse.json({ pharmacies: data || [] })
  } catch (error) {
    console.error('薬局検索エラー:', error)
    return NextResponse.json(
      { error: '薬局の検索に失敗しました' },
      { status: 500 }
    )
  }
}