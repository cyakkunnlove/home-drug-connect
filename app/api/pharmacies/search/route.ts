import { NextRequest, NextResponse } from 'next/server'
import { createClient, createReadOnlyClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/rate-limit'
import { QueryMonitor } from '@/lib/supabase/pool'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await withRateLimit(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = Math.min(parseFloat(searchParams.get('radius') || '5'), 50) // 最大50km制限
    const excludeFull = searchParams.get('excludeFull') !== 'false' // デフォルトで満床を除外
    const requiredServices = searchParams.getAll('services') // 必要なサービス
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // 最大100件制限

    // 入力検証
    if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: '座標が無効です', code: 'INVALID_COORDINATES' },
        { status: 400 }
      )
    }

    if (radius <= 0 || radius > 50) {
      return NextResponse.json(
        { error: '検索半径は1-50kmの範囲で指定してください', code: 'INVALID_RADIUS' },
        { status: 400 }
      )
    }
    
    // Read-only client for better performance
    const supabase = await createReadOnlyClient()

    try {
      // Monitor query performance
      const result = await QueryMonitor.execute('pharmacy_search', async () => {
      // PostGISのST_DWithin関数を使用して近隣の薬局を検索（最適化版）
      const { data, error } = await supabase
        .rpc('search_nearby_pharmacies_optimized', {
          p_lat: lat,
          p_lng: lng,
          p_radius_km: radius,
          p_exclude_full: excludeFull,
          p_required_services: requiredServices.length > 0 ? requiredServices : null,
          p_limit: limit
        })

      if (error) {
        console.error('RPC関数エラー:', error)
        
        // Optimized fallback query with proper distance calculation
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pharmacies')
          .select(`
            id, name, address, phone, email,
            twenty_four_support, holiday_support, emergency_support,
            current_capacity, max_capacity, coverage_radius_km,
            business_hours, services, description,
            ST_Y(location::geometry) as lat,
            ST_X(location::geometry) as lng,
            ST_Distance(
              location::geography,
              ST_Point(${lng}, ${lat})::geography
            ) / 1000 as distance_km
          `)
          .eq('status', 'active')
          .not('location', 'is', null)
          .order('distance_km')
          .limit(limit)

        if (fallbackError) throw fallbackError

        // Apply filters
        let filteredData = fallbackData || []
        
        // Distance filter
        filteredData = filteredData.filter(p => p.distance_km <= radius)
        
        // Capacity filter
        if (excludeFull) {
          filteredData = filteredData.filter(p => p.current_capacity < p.max_capacity)
        }
        
        // Service filters
        if (requiredServices.length > 0) {
          filteredData = filteredData.filter(pharmacy => {
            const services = pharmacy.services || {}
            return requiredServices.every(service => services[service] === true)
          })
        }

        return filteredData.map(pharmacy => ({
          ...pharmacy,
          distance_km: parseFloat(pharmacy.distance_km).toFixed(1)
        }))
      }

      return data || []
    })

    // Add cache headers for better performance
    const response = NextResponse.json({ 
      pharmacies: result,
      total: result.length,
      radius,
      center: { lat, lng },
      timestamp: new Date().toISOString()
    })

    // Cache for 5 minutes for location-based searches
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    response.headers.set('Vary', 'Accept-Encoding')
    
    return response
    
    } catch (error) {
      console.error('薬局検索エラー:', error)
      
      // Structured error response
      const errorResponse = {
        error: '薬局の検索に失敗しました',
        code: 'SEARCH_FAILED',
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID().slice(0, 8)
      }
      
      return NextResponse.json(errorResponse, { status: 500 })
    }
  })

  return rateLimitResult
}