import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, User, Shield, Bell, CreditCard } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/pharmacy/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">設定</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* プロフィール設定 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">プロフィール設定</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  組織名
                </label>
                <p className="text-gray-900">{profile?.organization_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <p className="text-gray-900">{profile?.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  役割
                </label>
                <p className="text-gray-900">薬局管理者</p>
              </div>
            </div>
          </div>

          {/* セキュリティ設定 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">セキュリティ</h2>
            </div>
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">パスワードを変更</div>
                <div className="text-sm text-gray-500 mt-1">
                  アカウントのパスワードを更新します
                </div>
              </button>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">通知設定</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">メール通知</div>
                  <div className="text-sm text-gray-500">
                    新規問い合わせがあった時にメールで通知を受け取る
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>
            </div>
          </div>

          {/* サブスクリプション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">サブスクリプション</h2>
            </div>
            <div className="space-y-4">
              <Link
                href="/dashboard/subscription"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">プランを管理</div>
                <div className="text-sm text-gray-500 mt-1">
                  現在のプランの確認と変更
                </div>
              </Link>
            </div>
          </div>

          {/* 危険な操作 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">危険な操作</h2>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              アカウントを削除
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}