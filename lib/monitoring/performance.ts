// Performance monitoring utilities for HOME-DRUG CONNECT
// Tracks web vitals, API performance, and user interactions

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  metadata?: Record<string, any>
}

interface APIMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
  error?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private apiMetrics: APIMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private isInitialized = false

  // Initialize performance monitoring
  init() {
    if (this.isInitialized || typeof window === 'undefined') return
    
    this.isInitialized = true
    
    // Monitor Core Web Vitals
    this.initWebVitals()
    
    // Monitor Long Tasks
    this.observeLongTasks()
    
    // Monitor Resource Timing
    this.observeResources()
    
    // Setup periodic reporting
    this.setupReporting()
  }

  // Initialize web vitals monitoring
  private async initWebVitals() {
    if (typeof window === 'undefined') return

    try {
      // Dynamically import web-vitals to avoid SSR issues
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')

      // Cumulative Layout Shift
      onCLS((metric) => {
        this.recordMetric({
          name: 'CLS',
          value: metric.value,
          rating: metric.rating || 'good',
          timestamp: Date.now(),
          metadata: { id: metric.id },
        })
      })

      // First Input Delay
      onFID((metric) => {
        this.recordMetric({
          name: 'FID',
          value: metric.value,
          rating: metric.rating || 'good',
          timestamp: Date.now(),
          metadata: { id: metric.id },
        })
      })

      // First Contentful Paint
      onFCP((metric) => {
        this.recordMetric({
          name: 'FCP',
          value: metric.value,
          rating: metric.rating || 'good',
          timestamp: Date.now(),
          metadata: { id: metric.id },
        })
      })

      // Largest Contentful Paint
      onLCP((metric) => {
        this.recordMetric({
          name: 'LCP',
          value: metric.value,
          rating: metric.rating || 'good',
          timestamp: Date.now(),
          metadata: { id: metric.id },
        })
      })

      // Time to First Byte
      onTTFB((metric) => {
        this.recordMetric({
          name: 'TTFB',
          value: metric.value,
          rating: metric.rating || 'good',
          timestamp: Date.now(),
          metadata: { id: metric.id },
        })
      })

      // Interaction to Next Paint (new metric)
      onINP((metric) => {
        this.recordMetric({
          name: 'INP',
          value: metric.value,
          rating: metric.rating || 'good',
          timestamp: Date.now(),
          metadata: { id: metric.id },
        })
      })
    } catch (error) {
      console.error('Failed to initialize web vitals:', error)
    }
  }

  // Observe long tasks (blocking main thread)
  private observeLongTasks() {
    if (typeof PerformanceObserver === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.recordMetric({
              name: 'long-task',
              value: entry.duration,
              rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
              timestamp: Date.now(),
              metadata: {
                startTime: entry.startTime,
                name: entry.name,
              },
            })
          }
        }
      })

      observer.observe({ entryTypes: ['longtask'] })
      this.observers.set('longtask', observer)
    } catch (error) {
      console.error('Failed to observe long tasks:', error)
    }
  }

  // Observe resource loading performance
  private observeResources() {
    if (typeof PerformanceObserver === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            this.recordMetric({
              name: 'slow-resource',
              value: resourceEntry.duration,
              rating: resourceEntry.duration > 3000 ? 'poor' : 'needs-improvement',
              timestamp: Date.now(),
              metadata: {
                name: resourceEntry.name,
                type: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
              },
            })
          }
        }
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', observer)
    } catch (error) {
      console.error('Failed to observe resources:', error)
    }
  }

  // Record a performance metric
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Log critical metrics
    if (metric.rating === 'poor') {
      console.warn(`Poor performance metric: ${metric.name}`, metric)
    }

    // Keep only recent metrics (last 100)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  // Record API performance
  recordAPICall(metric: APIMetric) {
    this.apiMetrics.push(metric)

    // Log slow API calls
    if (metric.duration > 2000) {
      console.warn(`Slow API call: ${metric.endpoint}`, metric)
    }

    // Keep only recent API metrics (last 100)
    if (this.apiMetrics.length > 100) {
      this.apiMetrics = this.apiMetrics.slice(-100)
    }
  }

  // Get performance summary
  getSummary() {
    const webVitals = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP']
    const summary: Record<string, any> = {}

    for (const vital of webVitals) {
      const metrics = this.metrics.filter((m) => m.name === vital)
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1]
        summary[vital] = {
          value: latest.value,
          rating: latest.rating,
        }
      }
    }

    // API performance summary
    if (this.apiMetrics.length > 0) {
      const avgDuration =
        this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / this.apiMetrics.length
      const errorRate =
        this.apiMetrics.filter((m) => m.status >= 400).length / this.apiMetrics.length

      summary.api = {
        avgDuration: Math.round(avgDuration),
        errorRate: (errorRate * 100).toFixed(2) + '%',
        totalCalls: this.apiMetrics.length,
      }
    }

    return summary
  }

  // Setup periodic reporting
  private setupReporting() {
    // Report every 30 seconds if there are metrics
    setInterval(() => {
      if (this.metrics.length > 0 || this.apiMetrics.length > 0) {
        this.report()
      }
    }, 30000)

    // Report on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.report()
        }
      })
    }
  }

  // Send metrics to monitoring service
  private async report() {
    const summary = this.getSummary()
    
    try {
      // Send to monitoring endpoint
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          metrics: this.metrics.slice(-20), // Last 20 metrics
          apiMetrics: this.apiMetrics.slice(-20), // Last 20 API calls
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
        keepalive: true, // Ensure request completes even on page unload
      })

      // Clear old metrics after reporting
      this.metrics = []
      this.apiMetrics = []
    } catch (error) {
      console.error('Failed to report metrics:', error)
    }
  }

  // Cleanup observers
  destroy() {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
    this.isInitialized = false
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor()

// Export functions
export function initPerformanceMonitoring() {
  performanceMonitor.init()
}

export function trackAPICall(
  endpoint: string,
  method: string,
  startTime: number,
  status: number,
  error?: string
) {
  performanceMonitor.recordAPICall({
    endpoint,
    method,
    duration: performance.now() - startTime,
    status,
    timestamp: Date.now(),
    error,
  })
}

export function trackCustomMetric(
  name: string,
  value: number,
  metadata?: Record<string, any>
) {
  performanceMonitor.recordMetric({
    name,
    value,
    rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor',
    timestamp: Date.now(),
    metadata,
  })
}

export function getPerformanceSummary() {
  return performanceMonitor.getSummary()
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Wait for page load to start monitoring
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.init()
    })
  } else {
    performanceMonitor.init()
  }
}