'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MobileNav from '@/components/dashboard/MobileNav'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Settings,
  LogOut,
  MessageSquare,
  BarChart3,
  Shield,
  Store
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/pharmacy/login')
          return
        }

        // ユーザープロフィール情報を取得
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('薬局ダッシュボードレイアウト - ユーザー情報:', { userId: user.id, role: profileData?.role })
        
        // 医師の場合は医師ダッシュボードにリダイレクト
        if (profileData?.role === 'doctor') {
          console.log('薬局ダッシュボードレイアウト - 医師ユーザーを検出、/doctorにリダイレクト')
          router.push('/doctor')
          return
        }
        
        setProfile(profileData)
      } catch (error) {
        console.error('認証エラー:', error)
        router.push('/pharmacy/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      router.push('/pharmacy/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
    { name: '薬局管理', href: '/dashboard/pharmacies', icon: Store },
    { name: 'お問い合わせ', href: '/dashboard/inquiries', icon: MessageSquare },
    { name: 'アナリティクス', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'サブスクリプション', href: '/dashboard/subscription', icon: CreditCard },
    { name: '設定', href: '/dashboard/settings', icon: Settings },
  ]

  // Check if user is admin
  const isAdmin = profile?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* モバイルナビゲーション */}
      <MobileNav 
        navigation={navigation} 
        profile={profile || {}} 
        isAdmin={isAdmin}
      />
      
      <div className="flex h-screen">
        {/* デスクトップサイドバー */}
        <div className="hidden lg:block w-64 bg-white shadow-md">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                HOME-DRUG CONNECT
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {profile?.organization_name}
              </p>
            </div>

            <nav className="flex-1 px-4 py-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              {isAdmin && (
                <div className="mt-8">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    管理者メニュー
                  </h3>
                  <ul className="mt-2 space-y-2">
                    <li>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Shield className="w-5 h-5" />
                        <span>管理者ダッシュボード</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </nav>

            <div className="p-4 border-t">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-auto">
          {/* モバイル用のトップマージン */}
          <div className="lg:hidden h-16"></div>
          {children}
        </div>
      </div>
    </div>
  )
}