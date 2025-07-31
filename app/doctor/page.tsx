import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusCircle, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'

export default async function DoctorDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">認証エラー: ユーザー情報が取得できませんでした。</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Get request statistics
  const { data: requests } = await supabase
    .from('requests')
    .select('status')
    .eq('doctor_id', user.id)

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    accepted: requests?.filter(r => r.status === 'accepted').length || 0,
    rejected: requests?.filter(r => r.status === 'rejected').length || 0,
  }

  // Get recent requests
  const { data: recentRequests } = await supabase
    .from('requests')
    .select(`
      *,
      pharmacy:pharmacies!pharmacy_id(name, address),
      responses(accepted)
    `)
    .eq('doctor_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              ダッシュボード
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/doctor/request/new"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              新規依頼作成
            </Link>
          </div>
        </div>

        {/* Statistics - モバイルファースト */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    総依頼数
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    回答待ち
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {stats.pending}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <div className="bg-yellow-100 rounded-lg p-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    承認済み
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.accepted}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <div className="bg-green-100 rounded-lg p-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    却下済み
                  </p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {stats.rejected}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <div className="bg-red-100 rounded-lg p-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests - モバイル最適化 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              最近の依頼
            </h3>
            <Link 
              href="/doctor/requests"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              すべて見る →
            </Link>
          </div>
          <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-100">
            {recentRequests && recentRequests.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentRequests.map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/doctor/requests/${request.id}`}
                      className="block hover:bg-gray-50 active:bg-gray-100 px-4 py-4 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {request.pharmacy?.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {request.pharmacy?.address}
                            </p>
                          </div>
                          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            request.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {request.status === 'pending' ? '回答待ち' :
                             request.status === 'accepted' ? '承認済み' :
                             request.status === 'rejected' ? '却下' :
                             request.status}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(request.created_at).toLocaleDateString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  まだ依頼がありません
                </p>
                <div className="mt-6">
                  <Link
                    href="/doctor/request/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                    最初の依頼を作成
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}