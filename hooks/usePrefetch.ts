import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface PrefetchOptions {
  priority?: 'high' | 'low'
  threshold?: number
}

// Custom hook for prefetching routes
export function usePrefetch(urls: string[], options: PrefetchOptions = {}) {
  const router = useRouter()
  const { priority = 'low', threshold = 0.5 } = options
  const observerRef = useRef<IntersectionObserver>()
  const prefetchedUrls = useRef(new Set<string>())

  const prefetch = useCallback((url: string) => {
    if (!prefetchedUrls.current.has(url)) {
      router.prefetch(url)
      prefetchedUrls.current.add(url)
    }
  }, [router])

  useEffect(() => {
    // Prefetch high priority URLs immediately
    if (priority === 'high') {
      urls.forEach(prefetch)
    }
  }, [urls, priority, prefetch])

  return { prefetch }
}

// Hook for prefetching on hover
export function usePrefetchOnHover(url: string) {
  const router = useRouter()
  const isPrefetched = useRef(false)

  const handleMouseEnter = useCallback(() => {
    if (!isPrefetched.current) {
      router.prefetch(url)
      isPrefetched.current = true
    }
  }, [router, url])

  return { onMouseEnter: handleMouseEnter }
}

// Hook for caching API responses
interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
}

export function useCache<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const revalidatingKeys = useRef(new Set<string>())

  const getCachedData = useCallback(async (): Promise<T> => {
    const cached = cache.current.get(key)
    const now = Date.now()

    // Return cached data if still fresh
    if (cached && now - cached.timestamp < ttl) {
      return cached.data
    }

    // Return stale data while revalidating
    if (cached && staleWhileRevalidate && !revalidatingKeys.current.has(key)) {
      revalidatingKeys.current.add(key)
      
      // Revalidate in background
      fetcher().then(data => {
        cache.current.set(key, { data, timestamp: Date.now() })
        revalidatingKeys.current.delete(key)
      }).catch(() => {
        revalidatingKeys.current.delete(key)
      })

      return cached.data
    }

    // Fetch fresh data
    const data = await fetcher()
    cache.current.set(key, { data, timestamp: now })
    return data
  }, [key, fetcher, ttl, staleWhileRevalidate])

  const invalidate = useCallback(() => {
    cache.current.delete(key)
  }, [key])

  return { getCachedData, invalidate }
}

// Service Worker registration for offline support
export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          registration => {
            console.log('SW registered:', registration)
          },
          error => {
            console.error('SW registration failed:', error)
          }
        )
      })
    }
  }, [])
}