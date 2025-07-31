import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default async function RequestsListPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get all requests for this doctor
  const { data: requests } = await supabase
    .from('requests')
    .select(`
      *,
      pharmacy:pharmacies!pharmacy_id(name, address, phone),
      responses(accepted, rejection_reasons, notes)
    `)
    .eq('doctor_id', user?.id)
    .order('created_at', { ascending: false })

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
        return '却下'
      case 'expired':
        return '期限切れ'
      default:
        return status
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            依頼一覧
          </h1>
          <Link
            href="/search"
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            新規依頼作成
          </Link>
        </div>

        {requests && requests.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {requests.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/doctor/requests/${request.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(request.status)}
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {request.pharmacy?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.pharmacy?.address}
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
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Patient Info Summary */}
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          薬剤数: {request.patient_info?.medications?.length || 0}件
                          {request.patient_info?.conditions?.length > 0 && 
                            ` | 既往歴: ${request.patient_info.conditions.length}件`
                          }
                        </p>
                      </div>

                      {/* Response Summary */}
                      {request.responses && request.responses.length > 0 && (
                        <div className="mt-2">
                          {request.responses[0].accepted ? (
                            <p className="text-sm text-green-600">
                              ✓ 薬局が受け入れを承認しました
                            </p>
                          ) : (
                            <div className="text-sm text-red-600">
                              <p>✗ 薬局が受け入れを却下しました</p>
                              {request.responses[0].rejection_reasons && (
                                <p className="text-xs mt-1">
                                  理由: {Object.entries(request.responses[0].rejection_reasons)
                                    .filter(([_, value]) => value)
                                    .map(([key]) => {
                                      switch(key) {
                                        case 'inventory': return '在庫不足'
                                        case 'capacity': return 'キャパシティ不足'
                                        case 'controlled_substance': return '管理薬品'
                                        case 'out_of_scope': return '対応範囲外'
                                        default: return key
                                      }
                                    })
                                    .join('、')
                                  }
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              依頼がありません
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              薬局を検索して新しい依頼を作成してください
            </p>
            <div className="mt-6">
              <Link
                href="/search"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                薬局を検索
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}