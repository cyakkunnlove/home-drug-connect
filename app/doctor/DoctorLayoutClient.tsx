'use client'

import { ReactNode } from 'react'
import MobileNav from '@/components/dashboard/MobileNav'
import Link from 'next/link'
import { 
  FileText, 
  PlusCircle, 
  Home,
  LogOut,
  Menu
} from 'lucide-react'

interface DoctorLayoutClientProps {
  children: ReactNode
  userEmail: string
  organizationName?: string
}

export default function DoctorLayoutClient({ 
  children, 
  userEmail, 
  organizationName 
}: DoctorLayoutClientProps) {
  const navigation = [
    { name: 'ダッシュボード', href: '/doctor', icon: Home },
    { name: '新規依頼作成', href: '/doctor/request/new', icon: PlusCircle },
    { name: '依頼一覧', href: '/doctor/requests', icon: FileText },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-gray-900">
                ドクターパネル
              </h1>
            </div>
            <div className="mt-2 px-4">
              <p className="text-sm text-gray-600">
                {organizationName || userEmail}
              </p>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <form action="/api/auth/logout" method="POST" className="w-full">
              <button
                type="submit"
                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-5 w-5" />
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <MobileNav 
        navigation={navigation} 
        profile={{ organization_name: organizationName || userEmail, role: 'doctor' }} 
        isAdmin={false} 
      />

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  )
}