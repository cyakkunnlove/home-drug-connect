'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, Filter, 
  Building2, User, Mail, RefreshCw, Bell, Sparkles, MessageSquare,
  ThumbsUp, ThumbsDown, Eye, Calendar, MapPin, Pill
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

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
}

interface RequestListProps {
  initialRequests: Request[]
}

export default function ImprovedRequestList({ initialRequests }: RequestListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all')
  const [requests, setRequests] = useState(initialRequests)
  const [newRequestIds, setNewRequestIds] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState(Date.now())
  const router = useRouter()
  
  // 新規依頼を検出
  useEffect(() => {
    const pendingIds = new Set(
      requests
        .filter(r => r.status === 'pending')
        .slice(0, 2) // 最初の2件を新規として扱う
        .map(r => r.id)
    )
    setNewRequestIds(pendingIds)
  }, [requests])

  // API経由でリクエストを取得
  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/requests?status=all', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }

      const data = await response.json()
      if (data.success && data.requests) {
        // 新しい依頼を検出
        const currentIds = new Set(requests.map(r => r.id))
        const newRequests = data.requests.filter((r: Request) => !currentIds.has(r.id))
        
        if (newRequests.length > 0) {
          // 新しい依頼がある場合、新着としてマーク
          const newIds = new Set(newRequests.map((r: Request) => r.id))
          setNewRequestIds(prev => new Set([...prev, ...newIds]))
        }
        
        setRequests(data.requests)
        setLastFetchTime(Date.now())
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }, [requests])

  // 定期的にポーリング（30秒ごと）
  useEffect(() => {
    // 初回はスキップ（initialRequestsを使用）
    const interval = setInterval(() => {
      fetchRequests()
    }, 30000) // 30秒ごと

    return () => clearInterval(interval)
  }, [fetchRequests])

  // ページがフォーカスされたときに更新
  useEffect(() => {
    const handleFocus = () => {
      // 最後の更新から30秒以上経過していたら更新
      if (Date.now() - lastFetchTime > 30000) {
        fetchRequests()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [lastFetchTime, fetchRequests])

  // 手動リフレッシュ
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchRequests()
      // 成功したら画面全体をリフレッシュして最新データを取得
      router.refresh()
    } finally {
      setIsRefreshing(false)
    }
  }
  
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    if (filter === 'pending') return request.status === 'pending'
    if (filter === 'responded') return request.status !== 'pending'
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '回答待ち'
      case 'accepted':
        return '承認済み'
      case 'rejected':
        return '拒否済み'
      case 'expired':
        return '期限切れ'
      default:
        return status
    }
  }

  const getUrgencyLevel = (request: Request) => {
    // AI分析による緊急度判定（デモ用）
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

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'high':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            緊急度: 高
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            緊急度: 中
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">フィルター:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                すべて ({requests.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 text-sm rounded-lg transition-all ${
                  filter === 'pending'
                    ? 'bg-yellow-100 text-yellow-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                未回答 ({requests.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('responded')}
                className={`px-3 py-1 text-sm rounded-lg transition-all ${
                  filter === 'responded'
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                回答済み ({requests.filter(r => r.status !== 'pending').length})
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              自動更新: 30秒ごと
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="今すぐ更新"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Request List */}
      <AnimatePresence mode="popLayout">
        {filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100"
          >
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === 'pending' ? '未回答の依頼はありません' : '依頼がありません'}
            </p>
          </motion.div>
        ) : (
          filteredRequests.map((request, index) => {
            const isNew = newRequestIds.has(request.id)
            const urgencyLevel = getUrgencyLevel(request)
            
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all hover:shadow-md ${
                  isNew ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'
                }`}
              >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {getStatusLabel(request.status)}
                          </h3>
                          {isNew && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"
                            >
                              <Bell className="h-3 w-3" />
                              新着
                            </motion.span>
                          )}
                          {getUrgencyBadge(urgencyLevel)}
                        </div>
                        <p className="text-xs text-gray-500">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {new Date(request.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Doctor Info */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          {request.doctor_info?.organization || request.doctor?.organization_name || '医療機関名未設定'}
                        </p>
                        <p className="text-xs text-blue-700 flex items-center">
                          <User className="h-3 w-3 mr-2" />
                          {request.doctor_info?.name || 'Dr.'}
                        </p>
                        <p className="text-xs text-blue-600 flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          {request.doctor_info?.email || request.doctor?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                      <Pill className="h-4 w-4 mr-1" />
                      処方薬 ({request.patient_info?.medications?.length || 0}種類)
                    </h4>
                    <div className="space-y-1">
                      {request.patient_info?.medications?.slice(0, 3).map((med: any, idx: number) => (
                        <p key={idx} className="text-xs text-gray-600">
                          • {med.name}
                          {med.dosage && ` - ${med.dosage}`}
                          {med.frequency && ` (${med.frequency})`}
                        </p>
                      ))}
                      {request.patient_info?.medications?.length > 3 && (
                        <p className="text-xs text-gray-500 italic">
                          他 {request.patient_info.medications.length - 3} 種類...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conditions */}
                  {request.patient_info?.conditions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">既往・現疾患</h4>
                      <p className="text-xs text-gray-600">
                        {request.patient_info.conditions.slice(0, 3).join('、')}
                        {request.patient_info.conditions.length > 3 && ' 他'}
                      </p>
                    </div>
                  )}

                  {/* AI Analysis Summary */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-purple-900 mb-1">AI分析サマリー</p>
                        <p className="text-xs text-purple-700 line-clamp-2">
                          {request.ai_document?.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      詳細確認
                    </span>
                    {request.status === 'pending' && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        返信必要
                      </span>
                    )}
                  </div>
                  
                  <Link
                    href={`/dashboard/requests/${request.id}`}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    詳細を見る
                  </Link>
                </div>
              </motion.div>
            )
          })
        )}
      </AnimatePresence>
    </div>
  )
}