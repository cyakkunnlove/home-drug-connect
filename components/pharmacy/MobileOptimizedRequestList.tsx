'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, Filter, 
  Building2, User, Mail, RefreshCw, Bell, Sparkles, MessageSquare,
  Eye, Calendar, Pill, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import PullToRefresh from '@/components/ui/PullToRefresh'
import { RequestCardSkeleton } from '@/components/ui/SkeletonLoader'
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate'

interface Request {
  id: string
  status: string
  created_at: string
  patient_info: any
  doctor_info?: {
    name?: string
    organization?: string
    email?: string
  }
  doctor: {
    organization_name?: string
    email: string
  }
  responses?: Array<{
    accepted: boolean
  }>
  ai_document?: string
  pharmacy?: {
    name: string
    address: string
  }
}

interface RequestListProps {
  initialRequests: Request[]
}

export default function MobileOptimizedRequestList({ initialRequests }: RequestListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all')
  const [requests, setRequests] = useState(initialRequests)
  const [newRequestIds, setNewRequestIds] = useState<Set<string>>(new Set())
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const router = useRouter()
  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Initialize with skeleton loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Detect new requests
  useEffect(() => {
    const pendingIds = new Set(
      requests
        .filter(r => r.status === 'pending')
        .slice(0, 2)
        .map(r => r.id)
    )
    setNewRequestIds(pendingIds)
  }, [requests])

  // Fetch requests with loading states
  const fetchRequests = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setIsInitialLoading(true)
    
    try {
      const response = await fetch('/api/requests?status=all', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to fetch requests')

      const data = await response.json()
      if (data.success && data.requests) {
        // Detect new requests
        const currentIds = new Set(requests.map(r => r.id))
        const newRequests = data.requests.filter((r: Request) => !currentIds.has(r.id))
        
        if (newRequests.length > 0) {
          const newIds = new Set(newRequests.map((r: Request) => r.id))
          setNewRequestIds(prev => new Set([...prev, ...newIds]))
          
          // iOS-style haptic feedback simulation
          if ('vibrate' in navigator) {
            navigator.vibrate(10)
          }
        }
        
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsInitialLoading(false)
    }
  }, [requests])

  // Pull to refresh handler
  const handleRefresh = async () => {
    await fetchRequests()
    router.refresh()
  }

  // Infinite scroll setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          // Load more logic here if needed
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    observerRef.current = observer
    return () => observer.disconnect()
  }, [isLoadingMore])

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    if (filter === 'pending') return request.status === 'pending'
    if (filter === 'responded') return request.status !== 'pending'
    return true
  })

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="h-5 w-5 text-amber-500" />,
      accepted: <CheckCircle className="h-5 w-5 text-green-500" />,
      rejected: <XCircle className="h-5 w-5 text-red-500" />,
      expired: <AlertCircle className="h-5 w-5 text-gray-400" />
    }
    return icons[status as keyof typeof icons] || <FileText className="h-5 w-5 text-gray-400" />
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: '回答待ち',
      accepted: '承認済み',
      rejected: '拒否済み',
      expired: '期限切れ'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getUrgencyLevel = (request: Request) => {
    const hasNarcotics = request.patient_info?.medications?.some((med: any) => 
      med.name?.includes('麻薬') || med.name?.includes('オピオイド')
    )
    const isTerminal = request.patient_info?.conditions?.some((cond: string) =>
      cond.includes('末期') || cond.includes('ターミナル')
    )
    
    if (hasNarcotics || isTerminal) return 'high'
    if (request.patient_info?.medications?.length > 5) return 'medium'
    return 'low'
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Filter Bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 active:scale-95'
                  }`}
                >
                  すべて ({requests.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    filter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-600 active:scale-95'
                  }`}
                >
                  未回答 ({requests.filter(r => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('responded')}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    filter === 'responded'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 active:scale-95'
                  }`}
                >
                  回答済み ({requests.filter(r => r.status !== 'pending').length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Request List */}
        <div className="px-4 py-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {isInitialLoading ? (
              // Skeleton Loading
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RequestCardSkeleton />
                </motion.div>
              ))
            ) : filteredRequests.length === 0 ? (
              // Empty State
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-center">
                  {filter === 'pending' ? '未回答の依頼はありません' : '依頼がありません'}
                </p>
              </motion.div>
            ) : (
              // Request Cards
              filteredRequests.map((request, index) => {
                const isNew = newRequestIds.has(request.id)
                const urgencyLevel = getUrgencyLevel(request)
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Link href={`/dashboard/requests/${request.id}`}>
                      <motion.div
                        className={`bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform ${
                          isNew ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Card Header */}
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getStatusIcon(request.status)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    {getStatusLabel(request.status)}
                                  </h3>
                                  {isNew && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                                    >
                                      新着
                                    </motion.span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(request.created_at).toLocaleString('ja-JP', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="px-4 pb-4 space-y-3">
                          {/* Pharmacy Info (if multiple pharmacies) */}
                          {request.pharmacy && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-700 font-medium">
                                {request.pharmacy.name}
                              </span>
                            </div>
                          )}
                          
                          {/* Doctor Info */}
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700 font-medium">
                              {request.doctor_info?.organization || request.doctor?.organization_name || '医療機関'}
                            </span>
                          </div>

                          {/* Quick Stats */}
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Pill className="h-3.5 w-3.5" />
                              <span>{request.patient_info?.medications?.length || 0}種類</span>
                            </div>
                            {urgencyLevel === 'high' && (
                              <div className="flex items-center space-x-1 text-red-600">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span className="font-medium">緊急</span>
                              </div>
                            )}
                          </div>

                          {/* Action Indicator */}
                          {request.status === 'pending' && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-xs text-amber-600 font-medium flex items-center">
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                返信が必要です
                              </span>
                              <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <ChevronRight className="h-4 w-4 text-amber-600" />
                              </motion.div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="h-20" />
        </div>
      </div>
    </PullToRefresh>
  )
}