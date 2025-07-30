import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Shield, 
  Users, 
  Edit, 
  Calendar,
  Building2
} from 'lucide-react'

export default async function PharmacyDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/pharmacy/login')
  }

  // ユーザーの会社情報を取得
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, companies(*)')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    redirect('/dashboard')
  }

  // 薬局情報を取得（会社に属していることを確認）
  const { data: pharmacy, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('company_id', userData.company_id)
    .single()

  if (error || !pharmacy) {
    redirect('/dashboard/pharmacies')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/pharmacies" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{pharmacy.name}</h1>
                <p className="text-sm text-gray-600">{userData.companies?.name}</p>
              </div>
            </div>
            <Link
              href={`/dashboard/pharmacies/${pharmacy.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              編集
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              基本情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">薬局名</p>
                <p className="font-medium text-gray-900">{pharmacy.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">ステータス</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  pharmacy.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {pharmacy.status === 'active' ? '公開中' : '非公開'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  住所
                </p>
                <p className="font-medium text-gray-900">
                  {pharmacy.formatted_address || pharmacy.address}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  電話番号
                </p>
                <p className="font-medium text-gray-900">{pharmacy.phone}</p>
              </div>
              {pharmacy.email && (
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    メールアドレス
                  </p>
                  <p className="font-medium text-gray-900">{pharmacy.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* サービス・施設情報 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              サービス・施設情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">対応可能サービス</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pharmacy.twenty_four_support ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {pharmacy.twenty_four_support ? '✓' : '×'}
                    </span>
                    <span className="text-gray-900">24時間対応</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pharmacy.holiday_support ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {pharmacy.holiday_support ? '✓' : '×'}
                    </span>
                    <span className="text-gray-900">休日対応</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pharmacy.emergency_support ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {pharmacy.emergency_support ? '✓' : '×'}
                    </span>
                    <span className="text-gray-900">緊急対応</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pharmacy.accepts_emergency ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {pharmacy.accepts_emergency ? '✓' : '×'}
                    </span>
                    <span className="text-gray-900">緊急時の新規受入</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">施設基準・設備</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pharmacy.has_clean_room ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {pharmacy.has_clean_room ? '✓' : '×'}
                    </span>
                    <span className="text-gray-900">無菌調剤室</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pharmacy.handles_narcotics ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {pharmacy.handles_narcotics ? '✓' : '×'}
                    </span>
                    <span className="text-gray-900">麻薬取扱い</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 受入能力 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              受入能力
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">現在の受入状況</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {pharmacy.current_capacity || 0} / {pharmacy.max_capacity || 10} 名
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${((pharmacy.current_capacity || 0) / (pharmacy.max_capacity || 10)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  残り受入可能人数: {(pharmacy.max_capacity || 10) - (pharmacy.current_capacity || 0)} 名
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">対応可能範囲</p>
                <p className="font-medium text-gray-900">{pharmacy.service_radius_km} km</p>
              </div>
            </div>
          </div>

          {/* その他の情報 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              その他の情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">登録日</p>
                <p className="font-medium text-gray-900">
                  {new Date(pharmacy.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">最終更新日</p>
                <p className="font-medium text-gray-900">
                  {new Date(pharmacy.updated_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}