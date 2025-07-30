'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  Eye, 
  TrendingUp,
  Plus,
  Store 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null)
  const [pharmacyCount, setPharmacyCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/pharmacy/login')
          return
        }

        // ユーザーの会社情報を取得
        const { data: userDataResult } = await supabase
          .from('users')
          .select('company_id, companies(*)')
          .eq('id', user.id)
          .single()
        
        setUserData(userDataResult)

        // 会社の薬局数を取得（company_idがある場合のみ）
        if (userDataResult?.company_id) {
          const { count } = await supabase
            .from('pharmacies')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', userDataResult.company_id)
          setPharmacyCount(count || 0)
        } else {
          // 後方互換性: company_idがない場合はuser_idで検索
          const { count } = await supabase
            .from('pharmacies')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
          setPharmacyCount(count || 0)
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 統計情報（現時点ではモックデータ）
  const stats = [
    {
      name: '管理薬局数',
      value: `${pharmacyCount || 0}店舗`,
      icon: Store,
      description: '登録済み薬局',
    },
    {
      name: 'プロフィール閲覧数',
      value: '0回',
      icon: Eye,
      description: '今月',
    },
    {
      name: '会社ステータス',
      value: userData?.companies?.status === 'active' ? '運用中' : '停止中',
      icon: Building2,
      description: userData?.companies?.name || '',
    },
    {
      name: '問い合わせ数',
      value: '0件',
      icon: TrendingUp,
      description: '今月',
    },
  ]

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">
        ダッシュボード
      </h1>

      {!userData?.company_id && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium mb-2">
            会社情報の設定が必要です
          </p>
          <p className="text-red-700 text-sm mb-3">
            新しいシステムでは、会社単位で複数の薬局を管理できるようになりました。
            既存のアカウントを継続してご利用いただくには、会社情報の移行が必要です。
          </p>
          <p className="text-red-700 text-sm">
            お手数ですが、サポートまでお問い合わせください。
            <Link href="/contact" className="font-medium underline ml-1">
              お問い合わせはこちら
            </Link>
          </p>
        </div>
      )}
      
      {userData?.company_id && pharmacyCount === 0 && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            薬局情報が未登録です。
            <Link href="/dashboard/pharmacies/new" className="font-medium underline ml-1">
              薬局を登録
            </Link>
            してください。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {stat.value}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              {stat.name}
            </h3>
            {stat.description && (
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/pharmacies"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">薬局一覧</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </Link>
            <Link
              href="/dashboard/pharmacies/new"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">新規薬局登録</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">会社情報設定</span>
              </div>
              <span className="text-sm text-gray-500">→</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            お知らせ
          </h2>
          <ul className="space-y-3">
            <li className="text-sm text-gray-600">
              <span className="text-xs text-gray-500">2025/07/30</span>
              <p className="mt-1">
                HOME-DRUG CONNECTへようこそ！薬局情報を登録して、在宅医療をサポートしましょう。
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}