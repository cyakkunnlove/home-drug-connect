'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Filter, Building2, User, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedPage, { AnimatedList } from '@/components/ui/AnimatedPage'
import PullToRefresh from '@/components/ui/PullToRefresh'
import TouchFeedback, { SwipeableItem } from '@/components/ui/TouchFeedback'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'

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
}

interface RequestListProps {
  initialRequests: Request[]
  onRefresh?: () => Promise<void>
  isLoading?: boolean
}

export default function EnhancedRequestList({ initialRequests, onRefresh, isLoading = false }: RequestListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all')
  const [requests, setRequests] = useState(initialRequests)

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
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
        return '却下済み'
      case 'expired':
        return '期限切れ'
      default:
        return status
    }
  }

  if (isLoading) {
    return <ListSkeleton count={5} />
  }

  return (
    <AnimatedPage>
      <PullToRefresh onRefresh={handleRefresh}>
        <div>
          {/* Filter Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 border-b border-gray-200"
          >
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <TouchFeedback
                onTap={() => setFilter('all')}
                className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm min-h-[44px] flex items-center ${
                  filter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                hapticFeedback="light"
              >
                すべて ({requests.length})
              </TouchFeedback>
              <TouchFeedback
                onTap={() => setFilter('pending')}
                className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm min-h-[44px] flex items-center ${
                  filter === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                hapticFeedback="light"
              >
                未回答 ({requests.filter(r => r.status === 'pending').length})
              </TouchFeedback>
              <TouchFeedback
                onTap={() => setFilter('responded')}
                className={`whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm min-h-[44px] flex items-center ${
                  filter === 'responded'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                hapticFeedback="light"
              >
                回答済み ({requests.filter(r => r.status !== 'pending').length})
              </TouchFeedback>
            </nav>
          </motion.div>

          {/* Request List */}
          {filteredRequests.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white shadow overflow-hidden sm:rounded-lg"
            >
              <AnimatedList className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <SwipeableItem
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors"
                    leftAction={
                      request.status === 'pending' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : null
                    }
                    rightAction={
                      request.status === 'pending' ? (
                        <XCircle className="h-5 w-5" />
                      ) : null
                    }
                  >
                    <Link
                      href={`/dashboard/requests/${request.id}`}
                      className="block"
                    >
                      <TouchFeedback className="px-4 py-4 sm:px-6 min-h-[80px]" hapticFeedback="light">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(request.status)}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center">
                                <div className="flex flex-col">
                                  <p className="text-sm font-medium text-gray-900 flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {request.doctor_info?.name || request.doctor.email}
                                  </p>
                                  {request.doctor_info?.organization && (
                                    <p className="text-xs text-gray-600 flex items-center mt-0.5">
                                      <Building2 className="h-3 w-3 mr-1" />
                                      {request.doctor_info.organization}
                                    </p>
                                  )}
                                  {request.doctor_info?.email && (
                                    <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {request.doctor_info.email}
                                    </p>
                                  )}
                                </div>
                                {request.status === 'pending' && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    要対応
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                薬剤: {request.patient_info?.medications?.length || 0}件
                                {request.patient_info?.conditions?.length > 0 && 
                                  ` | 既往歴あり`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end ml-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getStatusLabel(request.status)}
                            </span>
                            <p className="mt-2 text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </TouchFeedback>
                    </Link>
                  </SwipeableItem>
                ))}
              </AnimatedList>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white rounded-lg shadow"
            >
              <Filter className="mx-auto h-12 w-12 text-gray-400" />
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-sm font-medium text-gray-900"
              >
                {filter === 'pending' ? '未回答の依頼はありません' :
                 filter === 'responded' ? '回答済みの依頼はありません' :
                 '依頼がありません'}
              </motion.h3>
              <p className="mt-2 text-sm text-gray-500">
                新しい依頼が届くまでお待ちください
              </p>
            </motion.div>
          )}
        </div>
      </PullToRefresh>
    </AnimatedPage>
  )
}