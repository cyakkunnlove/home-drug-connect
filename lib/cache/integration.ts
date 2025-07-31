// Cache Integration for HOME-DRUG CONNECT API Routes
// Priority: MEDIUM | Impact: HIGH | Effort: 2-3 days

import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheKeys, CACHE_TTL, getCacheStats, checkCacheHealth } from './redis'

/**
 * Cache middleware HOC for API routes
 */
export function withCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    ttl?: number
    keyGenerator?: (request: NextRequest) => string
    skipCache?: (request: NextRequest) => boolean
    cacheControlHeader?: string
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      ttl = CACHE_TTL.STATIC_DATA,
      keyGenerator,
      skipCache,
      cacheControlHeader,
    } = options

    // Skip cache if condition met
    if (skipCache && skipCache(request)) {
      return await handler(request)
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(request)
      : generateDefaultCacheKey(request)

    try {
      // Try to get from cache first
      const cachedResponse = await cache.get<{
        data: any
        headers: Record<string, string>
      }>(cacheKey)

      if (cachedResponse) {
        const response = NextResponse.json(cachedResponse.data)
        
        // Restore headers
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
        
        // Add cache hit header
        response.headers.set('X-Cache', 'HIT')
        response.headers.set('X-Cache-Key', cacheKey)
        
        return response
      }

      // Execute handler if not in cache
      const response = await handler(request)
      
      // Only cache successful responses
      if (response.status === 200) {
        const responseData = await response.json()
        const headersObj: Record<string, string> = {}
        
        // Collect relevant headers
        response.headers.forEach((value, key) => {
          if (shouldCacheHeader(key)) {
            headersObj[key] = value
          }
        })

        // Cache the response
        await cache.set(cacheKey, {
          data: responseData,
          headers: headersObj,
        }, ttl)

        // Create new response with cache headers
        const newResponse = NextResponse.json(responseData)
        
        // Restore headers
        Object.entries(headersObj).forEach(([key, value]) => {
          newResponse.headers.set(key, value)
        })
        
        // Add cache miss header
        newResponse.headers.set('X-Cache', 'MISS')
        newResponse.headers.set('X-Cache-Key', cacheKey)
        
        // Add Cache-Control header if specified
        if (cacheControlHeader) {
          newResponse.headers.set('Cache-Control', cacheControlHeader)
        }
        
        return newResponse
      }

      return response
    } catch (error) {
      console.error('Cache middleware error:', error)
      // Fallback to handler without cache
      return await handler(request)
    }
  }
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(request: NextRequest): string {
  const url = new URL(request.url)
  const path = url.pathname
  const searchParams = url.searchParams.toString()
  
  return `api:${path}:${searchParams}`
}

/**
 * Determine if header should be cached
 */
function shouldCacheHeader(headerName: string): boolean {
  const cacheableHeaders = [
    'content-type',
    'content-encoding',
    'vary',
    'etag',
    'last-modified',
  ]
  
  return cacheableHeaders.includes(headerName.toLowerCase())
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm pharmacy search cache for popular locations
   */
  static async warmPharmacySearchCache(): Promise<void> {
    const popularLocations = [
      { lat: 35.6762, lng: 139.6503, name: 'Tokyo' }, // Tokyo
      { lat: 34.6937, lng: 135.5023, name: 'Osaka' }, // Osaka
      { lat: 35.1815, lng: 136.9066, name: 'Nagoya' }, // Nagoya
      { lat: 33.5904, lng: 130.4017, name: 'Fukuoka' }, // Fukuoka
      { lat: 43.0642, lng: 141.3469, name: 'Sapporo' }, // Sapporo
    ]

    const radiusOptions = [5, 10, 20] // km
    
    console.log('Starting pharmacy search cache warming...')
    
    for (const location of popularLocations) {
      for (const radius of radiusOptions) {
        try {
          const cacheKey = CacheKeys.pharmacySearch(
            location.lat, 
            location.lng, 
            radius, 
            JSON.stringify({})
          )
          
          // Check if already cached
          const exists = await cache.exists(cacheKey)
          if (!exists) {
            // This would make actual API call to warm cache
            // Implementation depends on your search function
            console.log(`Warming cache for ${location.name} (${radius}km)`)
            
            // Set placeholder data or make actual API call
            await cache.set(cacheKey, [], CACHE_TTL.PHARMACY_SEARCH)
          }
        } catch (error) {
          console.error(`Failed to warm cache for ${location.name}:`, error)
        }
      }
    }
    
    console.log('Pharmacy search cache warming completed')
  }

  /**
   * Warm drug search cache for common queries
   */
  static async warmDrugSearchCache(): Promise<void> {
    const commonQueries = [
      'アスピリン', 'イブプロフェン', 'パラセタモール',
      'アモキシシリン', 'ロキソニン', 'カロナール',
      '血圧', '糖尿病', '風邪薬', '胃薬', '鎮痛剤'
    ]

    console.log('Starting drug search cache warming...')
    
    for (const query of commonQueries) {
      try {
        const cacheKey = CacheKeys.drugSearch(query, 50)
        
        const exists = await cache.exists(cacheKey)
        if (!exists) {
          console.log(`Warming drug search cache for: ${query}`)
          
          // Set placeholder or make actual API call
          await cache.set(cacheKey, [], CACHE_TTL.DRUG_SEARCH)
        }
      } catch (error) {
        console.error(`Failed to warm drug cache for ${query}:`, error)
      }
    }
    
    console.log('Drug search cache warming completed')
  }
}

/**
 * Cache monitoring and analytics
 */
export class CacheMonitor {
  private static hitCount = 0
  private static missCount = 0
  
  static recordHit(): void {
    this.hitCount++
  }
  
  static recordMiss(): void {
    this.missCount++
  }
  
  static getHitRate(): number {
    const total = this.hitCount + this.missCount
    return total > 0 ? (this.hitCount / total) * 100 : 0
  }
  
  static getStats(): {
    hits: number
    misses: number
    hitRate: number
    total: number
  } {
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: this.getHitRate(),
      total: this.hitCount + this.missCount,
    }
  }
  
  static reset(): void {
    this.hitCount = 0
    this.missCount = 0
  }
}

/**
 * Cache health check endpoint
 */
export async function getCacheHealthReport(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  redis: {
    status: 'healthy' | 'unhealthy'
    latency?: number
    error?: string
  }
  stats: {
    keyCount: number
    memoryUsage: string
  }
  monitoring: {
    hits: number
    misses: number
    hitRate: number
  }
}> {
  const [redisHealth, cacheStats] = await Promise.all([
    checkCacheHealth(),
    getCacheStats(),
  ])
  
  const monitoringStats = CacheMonitor.getStats()
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (redisHealth.status === 'unhealthy') {
    overallStatus = 'unhealthy'
  } else if (redisHealth.latency && redisHealth.latency > 100) {
    overallStatus = 'degraded'
  }
  
  return {
    status: overallStatus,
    redis: redisHealth,
    stats: cacheStats,
    monitoring: monitoringStats,
  }
}

/**
 * Prebuilt cache configurations for common endpoints
 */
export const CacheConfigs = {
  // Pharmacy search - short TTL due to dynamic nature
  pharmacySearch: {
    ttl: CACHE_TTL.PHARMACY_SEARCH,
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url)
      const lat = url.searchParams.get('lat')
      const lng = url.searchParams.get('lng')
      const radius = url.searchParams.get('radius') || '5'
      const services = url.searchParams.getAll('services').sort().join(',')
      const excludeFull = url.searchParams.get('excludeFull') || 'true'
      
      return CacheKeys.pharmacySearch(
        parseFloat(lat || '0'),
        parseFloat(lng || '0'),
        parseFloat(radius),
        JSON.stringify({ services, excludeFull })
      )
    },
    cacheControlHeader: 'public, max-age=300, stale-while-revalidate=60',
  },
  
  // Drug search - longer TTL for static data
  drugSearch: {
    ttl: CACHE_TTL.DRUG_SEARCH,
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url)
      const query = url.searchParams.get('query') || ''
      const limit = url.searchParams.get('limit') || '50'
      
      return CacheKeys.drugSearch(query, parseInt(limit))
    },
    cacheControlHeader: 'public, max-age=1800, stale-while-revalidate=300',
  },
  
  // Analytics - daily cache for performance
  analytics: {
    ttl: CACHE_TTL.ANALYTICS_DAILY,
    keyGenerator: (request: NextRequest) => {
      const url = new URL(request.url)
      const pharmacyId = url.searchParams.get('pharmacyId') || 'all'
      const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
      
      return CacheKeys.analyticsDaily(pharmacyId, date)
    },
    cacheControlHeader: 'private, max-age=3600, stale-while-revalidate=1800',
  },
}