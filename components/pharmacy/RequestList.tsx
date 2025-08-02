'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Filter, Building2, User, Mail, RefreshCw } from 'lucide-react'
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
}

export default function RequestList({ initialRequests }: RequestListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all')
  
  const filteredRequests = initialRequests.filter(request => {
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

  return (
    <div>
      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            すべて ({initialRequests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            未回答 ({initialRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('responded')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'responded'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            回答済み ({initialRequests.filter(r => r.status !== 'pending').length})
          </button>
        </nav>
      </div>

      {/* Request List */}
      {filteredRequests.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/dashboard/requests/${request.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {request.doctor?.organization_name || request.doctor?.email || '医療機関情報なし'}
                            </p>
                            {request.status === 'pending' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                要対応
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            薬剤: {request.patient_info?.medications?.length || 0}件
                            {request.patient_info?.conditions?.length > 0 && 
                              ` | 既往歴あり`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
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
                  </div>
                </Link>
              </li>
            ))}
          </ul>
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