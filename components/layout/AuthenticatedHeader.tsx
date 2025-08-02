'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, Search, Home, FileText } from 'lucide-react'
import NotificationCenter from '@/components/pharmacy/NotificationCenter'

export default function AuthenticatedHeader() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, organization_name')
          .eq('id', user.id)
          .single()
        
        setUser(user)
        setUserRole(userData?.role || null)
      }
      setIsLoading(false)
    }

    checkUser()

    // リアルタイムでauth状態を監視
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser()
      } else {
        setUser(null)
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading || !user) return null

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="bg-blue-600 text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {userRole === 'doctor' ? '医師' : '薬局'}としてログイン中
          </span>
          <span className="text-sm opacity-90">{user.email}</span>
        </div>
        
        <nav className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <Home className="w-4 h-4" />
            <span className="text-sm">ホーム</span>
          </Link>
          
          <Link href="/search" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <Search className="w-4 h-4" />
            <span className="text-sm">薬局検索</span>
          </Link>
          
          {userRole === 'doctor' && (
            <Link href="/doctor" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <FileText className="w-4 h-4" />
              <span className="text-sm">依頼管理</span>
            </Link>
          )}
          
          {(userRole === 'pharmacy_admin' || userRole === 'clinic_staff') && (
            <>
              <Link href="/dashboard" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                <User className="w-4 h-4" />
                <span className="text-sm">ダッシュボード</span>
              </Link>
              <NotificationCenter />
            </>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">ログアウト</span>
          </button>
        </nav>
      </div>
    </div>
  )
}