'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, Filter, 
  Building2, User, Mail, RefreshCw, Bell, Sparkles, MessageSquare,
  ThumbsUp, ThumbsDown, Eye, Calendar, MapPin, Pill
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  
  // 新規依頼を検出（デモ用）
  useEffect(() => {
    const pendingIds = new Set(
      requests
        .filter(r => r.status === 'pending')
        .slice(0, 2) // 最初の2件を新規として扱う
        .map(r => r.id)
    )
    setNewRequestIds(pendingIds)
  }, [requests])
  
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

  const handleQuickAccept = async (requestId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 実際の承認処理をここに実装
    console.log('Quick accept:', requestId)
    
    // デモ用：ステータス更新
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ))
  }

  const handleQuickReject = async (requestId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 実際の拒否処理をここに実装
    console.log('Quick reject:', requestId)
    
    // デモ用：ステータス更新
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ))
  }

  return (
    <div>
      {/* 新規依頼通知バナー */}
      {newRequestIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 animate-pulse" />
              <span className="font-medium">
                {newRequestIds.size}件の新規依頼が届いています
              </span>
            </div>
            <span className="text-sm opacity-90">
              迅速な対応をお願いします
            </span>
          </div>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            すべて 
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {requests.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              filter === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            未回答
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => setFilter('responded')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              filter === 'responded'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            回答済み
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
              {requests.filter(r => r.status !== 'pending').length}
            </span>
          </button>
        </nav>
      </div>

      {/* Request List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRequests.map((request) => {
              const urgency = getUrgencyLevel(request)
              const isNew = newRequestIds.has(request.id)
              
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`bg-white shadow-sm rounded-lg overflow-hidden border-2 transition-all ${
                    isNew ? 'border-blue-400 shadow-blue-100' : 'border-gray-200'
                  } ${request.status === 'pending' ? 'hover:shadow-md' : ''}`}
                >
                  <Link
                    href={`/dashboard/requests/${request.id}`}
                    className="block"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* ヘッダー部分 */}
                          <div className="flex items-start gap-4">
                            {getStatusIcon(request.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {request.doctor?.organization_name || request.doctor?.email || '医療機関情報なし'}
                                </h3>
                                
                                {/* ラベル */}
                                <div className="flex items-center gap-2">
                                  {isNew && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      <Sparkles className="h-3 w-3" />
                                      新着
                                    </motion.span>
                                  )}
                                  
                                  {urgency === 'high' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      緊急
                                    </span>
                                  )}
                                  
                                  {request.status === 'pending' && urgency !== 'high' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      要対応
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* AI要約 */}
                              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-gray-700">
                                    <p className="font-medium mb-1">AI要約：</p>
                                    <p>
                                      薬剤{request.patient_info?.medications?.length || 0}種類
                                      {request.patient_info?.conditions?.length > 0 && 
                                        `、既往歴${request.patient_info.conditions.length}件`
                                      }
                                      {urgency === 'high' && '、緊急対応が必要な可能性があります'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* 詳細情報 */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(request.created_at).toLocaleDateString('ja-JP', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Pill className="h-4 w-4" />
                                  <span>薬剤 {request.patient_info?.medications?.length || 0}種類</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>訪問エリア内</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ステータス/アクション部分 */}
                        <div className="ml-4">
                          {request.status === 'pending' ? (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={(e) => handleQuickAccept(request.id, e)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span className="whitespace-nowrap">承認</span>
                              </button>
                              
                              <button
                                onClick={(e) => handleQuickReject(request.id, e)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span className="whitespace-nowrap">拒否</span>
                              </button>
                              
                              <Link
                                href={`/dashboard/requests/${request.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="whitespace-nowrap">詳細</span>
                              </Link>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getStatusLabel(request.status)}
                              </span>
                              <p className="mt-2 text-xs text-gray-500">
                                回答済み
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Filter className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'pending' ? '未回答の依頼はありません' :
             filter === 'responded' ? '回答済みの依頼はありません' :
             '依頼がありません'}
          </h3>
        </div>
      )}
    </div>
  )
}