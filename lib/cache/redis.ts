// Redis Cache Implementation for HOME-DRUG CONNECT
// Priority: HIGH | Impact: HIGH | Effort: 3-4 days

import { Redis } from 'ioredis'

// Redis connection configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
}

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  PHARMACY_SEARCH: 5 * 60, // 5 minutes - dynamic content
  PHARMACY_DETAILS: 15 * 60, // 15 minutes - semi-static content
  DRUG_SEARCH: 30 * 60, // 30 minutes - static content
  USER_SESSION: 60 * 60, // 1 hour - session data
  ANALYTICS_DAILY: 24 * 60 * 60, // 24 hours - daily analytics
  SEARCH_SUGGESTIONS: 60 * 60, // 1 hour - search suggestions
  STATIC_DATA: 7 * 24 * 60 * 60, // 1 week - configuration data
} as const

// Global Redis client
let redisClient: Redis | null = null

/**
 * Get Redis client instance (singleton pattern)
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_CONFIG)
    
    // Error handling
    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error)
    })
    
    redisClient.on('connect', () => {
      console.log('Redis connected successfully')
    })
    
    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...')
    })
  }
  
  return redisClient
}

/**
 * Generic cache wrapper with error handling
 */
export class CacheManager {
  private redis: Redis
  
  constructor() {
    this.redis = getRedisClient()
  }
  
  /**
   * Get cached value with fallback
   */
  async get<T>(
    key: string, 
    fallback?: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    try {
      const cached = await this.redis.get(key)
      
      if (cached !== null) {
        return JSON.parse(cached)
      }
      
      // If fallback provided, execute and cache result
      if (fallback) {
        const result = await fallback()
        if (result !== null && result !== undefined) {
          await this.set(key, result, ttl)
        }
        return result
      }
      
      return null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      
      // If fallback available, use it when cache fails
      if (fallback) {
        return await fallback()
      }
      
      return null
    }
  }
  
  /**
   * Set cached value with TTL
   */
  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.STATIC_DATA): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      await this.redis.setex(key, ttl, serialized)
      return true
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      return false
    }
  }
  
  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key)
      return result > 0
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  }
  
  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return 0
      
      const result = await this.redis.del(...keys)
      return result
    } catch (error) {
      console.error(`Cache delete by pattern error for ${pattern}:`, error)
      return 0
    }
  }
  
  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }
  
  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl)
      return result === 1
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error)
      return false
    }
  }
  
  /**
   * Get multiple values at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys)
      return values.map(value => value ? JSON.parse(value) : null)
    } catch (error) {
      console.error(`Cache mget error for keys ${keys}:`, error)
      return keys.map(() => null)
    }
  }
  
  /**
   * Set multiple values at once
   */
  async mset<T>(data: Record<string, T>, ttl: number = CACHE_TTL.STATIC_DATA): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline()
      
      Object.entries(data).forEach(([key, value]) => {
        pipeline.setex(key, ttl, JSON.stringify(value))
      })
      
      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Cache mset error:', error)
      return false
    }
  }
  
  /**
   * Increment counter with TTL
   */
  async increment(key: string, ttl: number = CACHE_TTL.USER_SESSION): Promise<number> {
    try {
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, ttl)
      
      const results = await pipeline.exec()
      return results?.[0]?.[1] as number || 0
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error)
      return 0
    }
  }
}

// Singleton cache manager instance
export const cache = new CacheManager()

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // Pharmacy search results
  pharmacySearch: (lat: number, lng: number, radius: number, filters: string) =>
    `pharmacy:search:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}:${filters}`,
  
  // Individual pharmacy details
  pharmacyDetails: (id: string) => `pharmacy:details:${id}`,
  
  // Drug search results
  drugSearch: (query: string, limit: number) => `drug:search:${query}:${limit}`,
  
  // User session data
  userSession: (userId: string) => `user:session:${userId}`,
  
  // Analytics data
  analyticsDaily: (pharmacyId: string, date: string) => `analytics:daily:${pharmacyId}:${date}`,
  analyticsMonthly: (pharmacyId: string, month: string) => `analytics:monthly:${pharmacyId}:${month}`,
  
  // Search suggestions
  searchSuggestions: (query: string) => `suggestions:${query}`,
  
  // Rate limiting
  rateLimit: (type: string, clientId: string) => `rate_limit:${type}:${clientId}`,
  
  // Configuration data
  config: (key: string) => `config:${key}`,
}

/**
 * Cached search function for pharmacies
 */
export async function getCachedPharmacySearch(
  lat: number,
  lng: number,
  radius: number,
  filters: Record<string, any>,
  searchFn: () => Promise<any[]>
): Promise<any[]> {
  const filterString = JSON.stringify(filters)
  const cacheKey = CacheKeys.pharmacySearch(lat, lng, radius, filterString)
  
  const result = await cache.get(cacheKey, searchFn, CACHE_TTL.PHARMACY_SEARCH)
  return result || []
}

/**
 * Cached drug search function
 */
export async function getCachedDrugSearch(
  query: string,
  limit: number,
  searchFn: () => Promise<any[]>
): Promise<any[]> {
  const cacheKey = CacheKeys.drugSearch(query, limit)
  
  const result = await cache.get(cacheKey, searchFn, CACHE_TTL.DRUG_SEARCH)
  return result || []
}

/**
 * Cache invalidation helpers
 */
export class CacheInvalidation {
  /**
   * Invalidate pharmacy-related caches when pharmacy data changes
   */
  static async invalidatePharmacy(pharmacyId: string): Promise<void> {
    await Promise.all([
      cache.delete(CacheKeys.pharmacyDetails(pharmacyId)),
      cache.deleteByPattern(`pharmacy:search:*`), // Invalidate all search results
      cache.deleteByPattern(`analytics:*:${pharmacyId}:*`), // Invalidate analytics
    ])
  }
  
  /**
   * Invalidate search caches when new pharmacies are added
   */
  static async invalidateSearchCaches(): Promise<void> {
    await cache.deleteByPattern(`pharmacy:search:*`)
  }
  
  /**
   * Invalidate analytics caches
   */
  static async invalidateAnalytics(pharmacyId?: string): Promise<void> {
    const pattern = pharmacyId ? `analytics:*:${pharmacyId}:*` : `analytics:*`
    await cache.deleteByPattern(pattern)
  }
  
  /**
   * Clear all caches (admin function)
   */
  static async clearAll(): Promise<void> {
    try {
      await cache.redis.flushdb()
      console.log('All caches cleared')
    } catch (error) {
      console.error('Error clearing all caches:', error)
    }
  }
}

/**
 * Health check for Redis connection
 */
export async function checkCacheHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  latency?: number
  error?: string
}> {
  try {
    const start = Date.now()
    await cache.redis.ping()
    const latency = Date.now() - start
    
    return {
      status: 'healthy',
      latency,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  keyCount: number
  memoryUsage: string
  hitRate?: number
}> {
  try {
    const info = await cache.redis.info('memory')
    const keyCount = await cache.redis.dbsize()
    
    // Parse memory usage from info string
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown'
    
    return {
      keyCount,
      memoryUsage,
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return {
      keyCount: 0,
      memoryUsage: 'unknown',
    }
  }
}