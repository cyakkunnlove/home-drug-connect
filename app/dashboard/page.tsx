import { createClient } from '@/lib/supabase/server'
import { 
  Building2, 
  Users, 
  Eye, 
  TrendingUp 
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 薬局情報を取得
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // 統計情報（現時点ではモックデータ）
  const stats = [
    {
      name: '受入可能患者数',
      value: pharmacy ? `${pharmacy.max_capacity - pharmacy.current_capacity}名` : '未設定',
      icon: Users,
      description: pharmacy ? `現在 ${pharmacy.current_capacity}/${pharmacy.max_capacity}名` : '',
    },
    {
      name: 'プロフィール閲覧数',
      value: '0回',
      icon: Eye,
      description: '今月',
    },
    {
      name: 'ステータス',
      value: pharmacy?.status === 'active' ? '公開中' : '未公開',
      icon: Building2,
      description: pharmacy?.status === 'pending' ? '審査中' : '',
    },
    {
      name: '問い合わせ数',
      value: '0件',
      icon: TrendingUp,
      description: '今月',
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        ダッシュボード
      </h1>

      {!pharmacy && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            薬局情報が未登録です。
            <a href="/dashboard/pharmacy" className="font-medium underline ml-1">
              薬局情報を登録
            </a>
            してください。
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
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
            最近の活動
          </h2>
          <p className="text-gray-600 text-sm">
            まだ活動履歴がありません。
          </p>
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