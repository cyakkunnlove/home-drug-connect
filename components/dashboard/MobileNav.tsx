'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { signOut } from '@/lib/auth/actions'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface MobileNavProps {
  navigation: NavigationItem[]
  profile: {
    name?: string
    organization_name?: string
    role?: string
  }
  isAdmin: boolean
}

export default function MobileNav({ navigation, profile, isAdmin }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* モバイルヘッダー */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 min-w-0 mr-2">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              HOME-DRUG CONNECT
            </h2>
            {(profile?.name || profile?.organization_name) && (
              <div className="text-xs text-gray-600 mt-1">
                {profile?.name && <p className="truncate">{profile.name} 先生</p>}
                {profile?.organization_name && <p className="truncate">{profile.organization_name}</p>}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full pt-20">
              <nav className="flex-1 px-4 py-4">
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
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
                          onClick={() => setIsOpen(false)}
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
        </div>
      )}
    </>
  )
}

// Shieldアイコンのインポートが必要
import { Shield, LogOut } from 'lucide-react'