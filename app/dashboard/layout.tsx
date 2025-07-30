import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Settings,
  LogOut,
  MessageSquare,
  BarChart3,
  Shield
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/pharmacy/login')
  }

  // ユーザープロフィール情報を取得
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
    { name: '薬局情報', href: '/dashboard/pharmacy', icon: Building2 },
    { name: 'お問い合わせ', href: '/dashboard/inquiries', icon: MessageSquare },
    { name: 'アナリティクス', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'サブスクリプション', href: '/dashboard/subscription', icon: CreditCard },
    { name: '設定', href: '/dashboard/settings', icon: Settings },
  ]

  // Check if user is admin
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* サイドバー */}
        <div className="w-64 bg-white shadow-md">
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
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>ログアウト</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}