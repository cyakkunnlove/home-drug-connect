import { NextRequest } from 'next/server'

// Simple in-memory rate limiting implementation
// For production, use Redis or Upstash for distributed rate limiting

interface RateLimitStore {
  attempts: number
  resetTime: number
}

// Store rate limit data in memory (not suitable for multiple instances)
const rateLimitStore = new Map<string, RateLimitStore>()

// Configuration
const RATE_LIMIT_CONFIG = {
  // API endpoints with their specific limits
  '/api/pharmacies/search': {
    requests: 30,
    window: 60 * 1000, // 1 minute
  },
  '/api/requests': {
    requests: 20,
    window: 60 * 1000, // 1 minute
  },
  '/api/doctor/request': {
    requests: 10,
    window: 60 * 1000, // 1 minute
  },
  '/api/openai': {
    requests: 10,
    window: 60 * 1000, // 1 minute
  },
  // Default for all other endpoints
  default: {
    requests: 50,
    window: 60 * 1000, // 1 minute
  },
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

export function getRateLimitKey(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'anonymous'
  const pathname = new URL(request.url).pathname
  
  return `${ip}:${pathname}`
}

export function getRateLimitConfig(pathname: string) {
  // Find matching config or use default
  for (const [path, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return config
    }
  }
  return RATE_LIMIT_CONFIG.default
}

export async function rateLimit(request: NextRequest): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const key = getRateLimitKey(request)
  const pathname = new URL(request.url).pathname
  const config = getRateLimitConfig(pathname)
  const now = Date.now()

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      attempts: 0,
      resetTime: now + config.window,
    }
    rateLimitStore.set(key, entry)
  }

  // Increment attempts
  entry.attempts++

  // Check if limit exceeded
  const success = entry.attempts <= config.requests
  const remaining = Math.max(0, config.requests - entry.attempts)
  const reset = Math.ceil(entry.resetTime / 1000)

  return {
    success,
    limit: config.requests,
    remaining,
    reset,
  }
}

// Middleware helper for API routes
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  const { success, limit, remaining, reset } = await rateLimit(request)

  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset * 1000 - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Add rate limit headers to successful response
  const response = await handler()
  
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())

  return response
}

// Redis-based rate limiting for production
export interface RedisRateLimiter {
  check: (identifier: string) => Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }>
}

// Example Redis implementation (requires ioredis)
export function createRedisRateLimiter(/* redis: Redis */): RedisRateLimiter {
  // This is a placeholder for Redis-based rate limiting
  // Actual implementation would use Redis commands like INCR, EXPIRE, etc.
  return {
    async check(identifier: string) {
      // Redis implementation would go here
      return {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      }
    },
  }
}