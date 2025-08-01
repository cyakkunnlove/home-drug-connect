'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LogIn, UserPlus } from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUser(user)
        setUserRole(userData?.role || null)
      }
    }

    checkUser()
  }, [])

  const navigation = [
    { name: '薬局を探す', href: '/search' },
    { name: 'サービスについて', href: '#features' },
    { name: '利用方法', href: '#how-to-use' },
  ]

  const getDashboardLink = () => {
    if (!user || !userRole) return null
    
    switch (userRole) {
      case 'doctor':
        return { href: '/doctor', label: 'ドクターパネル' }
      case 'pharmacy_admin':
        return { href: '/dashboard', label: 'ダッシュボード' }
      case 'admin':
        return { href: '/admin', label: '管理画面' }
      default:
        return null
    }
  }

  const dashboardLink = getDashboardLink()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo size="small" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isHashLink = item.href.startsWith('#')
              const handleClick = (e: React.MouseEvent) => {
                if (isHashLink) {
                  e.preventDefault()
                  if (pathname !== '/') {
                    router.push('/' + item.href)
                  } else {
                    const element = document.querySelector(item.href)
                    element?.scrollIntoView({ behavior: 'smooth' })
                  }
                }
              }
              
              return isHashLink ? (
                <button
                  key={item.name}
                  onClick={handleClick}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              )
            })}
            
            {user ? (
              dashboardLink && (
                <Link
                  href={dashboardLink.href}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {dashboardLink.label}
                </Link>
              )
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  ログイン
                </Link>
                <Link
                  href="/pharmacy/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  薬局登録
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isHashLink = item.href.startsWith('#')
                const handleClick = (e: React.MouseEvent) => {
                  setIsMenuOpen(false)
                  if (isHashLink) {
                    e.preventDefault()
                    if (pathname !== '/') {
                      router.push('/' + item.href)
                    } else {
                      const element = document.querySelector(item.href)
                      element?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }
                }
                
                return isHashLink ? (
                  <button
                    key={item.name}
                    onClick={handleClick}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              })}
              
              {user ? (
                dashboardLink && (
                  <Link
                    href={dashboardLink.href}
                    className="block px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {dashboardLink.label}
                  </Link>
                )
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/pharmacy/register"
                    className="block px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    薬局登録
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}