import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusCircle, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'

export default async function DoctorDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get request statistics
  const { data: requests } = await supabase
    .from('requests')
    .select('status')
    .eq('doctor_id', user?.id)

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

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      総依頼数
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      回答待ち
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      承認済み
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.accepted}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      却下済み
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.rejected}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            最近の依頼
          </h3>
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            {recentRequests && recentRequests.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentRequests.map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/doctor/requests/${request.id}`}
                      className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {request.pharmacy?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.pharmacy?.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status === 'pending' ? '回答待ち' :
                             request.status === 'accepted' ? '承認済み' :
                             request.status === 'rejected' ? '却下' :
                             request.status}
                          </span>
                          <span className="ml-4 text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString('ja-JP')}
                          </span>
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