// Performance Monitoring API Endpoint for HOME-DRUG CONNECT
// Priority: MEDIUM | Impact: MEDIUM | Effort: 1-2 days

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Performance data types
interface PerformanceReport {
  webVitals: {
    FCP: number | null
    LCP: number | null
    FID: number | null
    CLS: number | null
    TTFB: number | null
  }
  customMetrics: Array<{
    name: string
    value: number
    timestamp: number
    metadata?: Record<string, any>
  }>
  navigationTiming: PerformanceNavigationTiming | null
  userAgent: string
  url: string
  timestamp: number
}

// POST - Receive performance data from client
export async function POST(request: NextRequest) {
  try {
    const data: PerformanceReport = await request.json()
    
    // Validate required fields
    if (!data.timestamp || !data.url) {
      return NextResponse.json(
        { error: 'Invalid performance data' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Extract client information
    const userAgent = request.headers.get('user-agent') || data.userAgent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // Store performance metrics
    const performanceData = {
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString(),
      user_agent: userAgent,
      client_ip: clientIP,
      
      // Web Vitals
      fcp: data.webVitals.FCP,
      lcp: data.webVitals.LCP,
      fid: data.webVitals.FID,
      cls: data.webVitals.CLS,
      ttfb: data.webVitals.TTFB,
      
      // Navigation timing
      dom_content_loaded: data.navigationTiming?.domContentLoadedEventEnd || null,
      load_event: data.navigationTiming?.loadEventEnd || null,
      
      // Custom metrics as JSONB
      custom_metrics: data.customMetrics || [],
      
      // Additional metadata
      connection_type: request.headers.get('connection') || null,
      device_memory: null, // Would need to be passed from client
    }

    // Insert into performance_logs table
    const { error: insertError } = await supabase
      .from('performance_logs')
      .insert(performanceData)

    if (insertError) {
      console.error('Failed to insert performance data:', insertError)
      return NextResponse.json(
        { error: 'Failed to store performance data' },
        { status: 500 }
      )
    }

    // Check for performance alerts
    const alerts = checkPerformanceAlerts(data)
    if (alerts.length > 0) {
      // Log alerts or send notifications
      console.warn('Performance alerts detected:', alerts)
      
      // Store alerts in alerts table
      for (const alert of alerts) {
        await supabase
          .from('performance_alerts')
          .insert({
            metric_name: alert.metric,
            metric_value: alert.value,
            threshold: alert.threshold,
            url: data.url,
            user_agent: userAgent,
            created_at: new Date().toISOString(),
          })
      }
    }

    return NextResponse.json({ 
      success: true, 
      alertsGenerated: alerts.length 
    })
    
  } catch (error) {
    console.error('Performance monitoring error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || 
                     new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    const url = searchParams.get('url')
    const metric = searchParams.get('metric')

    const supabase = await createClient()

    // Base query
    let query = supabase
      .from('performance_logs')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })
      .limit(1000)

    // Apply filters
    if (url) {
      query = query.ilike('url', `%${url}%`)
    }

    const { data: performanceLogs, error } = await query

    if (error) {
      console.error('Failed to fetch performance data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance data' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = calculatePerformanceStats(performanceLogs || [])
    
    // Get recent alerts
    const { data: alerts } = await supabase
      .from('performance_alerts')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      data: performanceLogs,
      stats,
      alerts: alerts || [],
      period: { startDate, endDate },
    })
    
  } catch (error) {
    console.error('Performance analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Performance alert thresholds
const PERFORMANCE_THRESHOLDS = {
  FCP: 2500, // First Contentful Paint - 2.5s
  LCP: 4000, // Largest Contentful Paint - 4s
  FID: 300,  // First Input Delay - 300ms
  CLS: 0.25, // Cumulative Layout Shift - 0.25
  TTFB: 1800, // Time to First Byte - 1.8s
}

function checkPerformanceAlerts(data: PerformanceReport): Array<{
  metric: string
  value: number
  threshold: number
  severity: 'warning' | 'critical'
}> {
  const alerts = []

  Object.entries(PERFORMANCE_THRESHOLDS).forEach(([metric, threshold]) => {
    const value = data.webVitals[metric as keyof typeof data.webVitals]
    
    if (value !== null && value > threshold) {
      alerts.push({
        metric,
        value,
        threshold,
        severity: value > threshold * 1.5 ? 'critical' : 'warning' as 'warning' | 'critical',
      })
    }
  })

  // Check custom metrics for slow operations
  data.customMetrics.forEach(metric => {
    if (metric.name.includes('API_') && metric.value > 5000) {
      alerts.push({
        metric: metric.name,
        value: metric.value,
        threshold: 5000,
        severity: 'warning',
      })
    }
    
    if (metric.name.includes('RENDER_') && metric.value > 100) {
      alerts.push({
        metric: metric.name,
        value: metric.value,
        threshold: 100,
        severity: 'warning',
      })
    }
  })

  return alerts
}

function calculatePerformanceStats(logs: any[]): {
  averages: Record<string, number>
  percentiles: Record<string, { p50: number; p90: number; p95: number }>
  trends: Record<string, 'improving' | 'degrading' | 'stable'>
} {
  if (logs.length === 0) {
    return {
      averages: {},
      percentiles: {},
      trends: {},
    }
  }

  const metrics = ['fcp', 'lcp', 'fid', 'cls', 'ttfb']
  const averages: Record<string, number> = {}
  const percentiles: Record<string, { p50: number; p90: number; p95: number }> = {}
  const trends: Record<string, 'improving' | 'degrading' | 'stable'> = {}

  metrics.forEach(metric => {
    const values = logs
      .map(log => log[metric])
      .filter(val => val !== null && val !== undefined)
      .sort((a, b) => a - b)

    if (values.length === 0) return

    // Calculate average
    averages[metric] = values.reduce((sum, val) => sum + val, 0) / values.length

    // Calculate percentiles
    const p50Index = Math.floor(values.length * 0.5)
    const p90Index = Math.floor(values.length * 0.9)
    const p95Index = Math.floor(values.length * 0.95)

    percentiles[metric] = {
      p50: values[p50Index] || 0,
      p90: values[p90Index] || 0,
      p95: values[p95Index] || 0,
    }

    // Calculate trend (simplified - compare first half vs second half)
    const midpoint = Math.floor(logs.length / 2)
    const firstHalf = logs.slice(0, midpoint).map(log => log[metric]).filter(val => val !== null)
    const secondHalf = logs.slice(midpoint).map(log => log[metric]).filter(val => val !== null)

    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
      const change = ((secondAvg - firstAvg) / firstAvg) * 100

      if (Math.abs(change) < 5) {
        trends[metric] = 'stable'
      } else if (change < 0) {
        trends[metric] = 'improving'
      } else {
        trends[metric] = 'degrading'
      }
    } else {
      trends[metric] = 'stable'
    }
  })

  return { averages, percentiles, trends }
}