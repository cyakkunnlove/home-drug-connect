import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, User, Shield, Bell, CreditCard } from 'lucide-react'
import DeleteAccountSection from '@/components/settings/DeleteAccountSection'
import ProfileEditForm from '@/components/settings/ProfileEditForm'

export const dynamic = 'force-dynamic'

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">プロフィール設定</h2>
              </div>
              <ProfileEditForm profile={profile} userRole="pharmacy_admin" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <p className="text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">※メールアドレスは変更できません</p>
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
              <h2 className="text-lg font-semibold text-gray-900">セキュリティ設定</h2>
            </div>
            <div className="space-y-4">
              <Link 
                href="/dashboard/settings/password" 
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">パスワード変更</p>
                <p className="text-sm text-gray-600 mt-1">アカウントのパスワードを変更します</p>
              </Link>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">通知設定</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">メール通知</p>
                  <p className="text-sm text-gray-600">新しいお問い合わせがあった時に通知</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  defaultChecked
                />
              </div>
            </div>
          </div>

          {/* サブスクリプション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">サブスクリプション</h2>
            </div>
            <div>
              <p className="text-gray-700">現在のプラン: <span className="font-medium">無料プラン</span></p>
              <Link href="/dashboard/subscription" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                プランの詳細を見る →
              </Link>
            </div>
          </div>

          {/* アカウント削除 */}
          <DeleteAccountSection />
        </div>
      </main>
    </div>
  )
}