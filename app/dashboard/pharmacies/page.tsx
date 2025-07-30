
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, MapPin, Phone, Users, Edit, Eye, Calendar } from 'lucide-react'
export const dynamic = 'force-dynamic'


export default async function PharmaciesListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/pharmacy/login')
  }

  // ユーザーの会社IDを取得
  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    redirect('/dashboard')
  }

  // 会社情報を取得
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', userData.company_id)
    .single()

  // 会社の全薬局を取得
  let pharmacies = []
  if (userData?.company_id) {
    const { data } = await supabase
      .from('pharmacies')
      .select(`
        *,
        current_capacity,
        max_capacity
      `)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })
    pharmacies = data || []
  } else {
    // 後方互換性: company_idがない場合はuser_idで検索
    const { data } = await supabase
      .from('pharmacies')
      .select(`
        *,
        current_capacity,
        max_capacity
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    pharmacies = data || []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">薬局一覧</h1>
                <p className="text-xs md:text-sm text-gray-600 truncate max-w-[200px] md:max-w-none">{company?.name}</p>
              </div>
            </div>
            <Link
              href="/dashboard/pharmacies/new"
              className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">新規薬局登録</span>
              <span className="sm:hidden">新規</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {pharmacies && pharmacies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {pharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pharmacy.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{pharmacy.formatted_address || pharmacy.address}</span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {pharmacy.phone}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      受入状況: {pharmacy.current_capacity || 0} / {pharmacy.max_capacity || 10} 名
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {pharmacy.twenty_four_support && (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        24時間対応
                      </span>
                    )}
                    {pharmacy.has_clean_room && (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        無菌室あり
                      </span>
                    )}
                    {pharmacy.handles_narcotics && (
                      <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        麻薬取扱い
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      pharmacy.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {pharmacy.status === 'active' ? '公開中' : '非公開'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      登録: {new Date(pharmacy.created_at).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/pharmacies/${pharmacy.id}`}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="詳細"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/dashboard/pharmacies/${pharmacy.id}/edit`}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-6">
              まだ薬局が登録されていません。
              <br />
              新規薬局を登録してください。
            </p>
            <Link
              href="/dashboard/pharmacies/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              最初の薬局を登録
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
