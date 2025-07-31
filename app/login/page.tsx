'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserCircle2, Building2, ArrowRight } from 'lucide-react'
import Logo from '@/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'pharmacy' | null>(null)

  const handleRoleSelect = (role: 'doctor' | 'pharmacy') => {
    setSelectedRole(role)
    // 選択後、適切なログインページにリダイレクト
    setTimeout(() => {
      if (role === 'doctor') {
        router.push('/doctor/login')
      } else {
        router.push('/pharmacy/login')
      }
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* ロゴ */}
        <div className="text-center mb-12">
          <Logo size="large" href="/" />
          <p className="mt-4 text-gray-600">
            医療従事者の方はログインしてください
          </p>
        </div>

        {/* ログイン選択カード */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* 医師ログイン */}
          <button
            onClick={() => handleRoleSelect('doctor')}
            className={`group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
              selectedRole === 'doctor' ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                医師・医療従事者
              </h2>
              <p className="text-gray-600 mb-6">
                クリニック・病院の医師、<br />
                看護師、医療スタッフの方
              </p>
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <span>ログインする</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* 薬局ログイン */}
          <button
            onClick={() => handleRoleSelect('pharmacy')}
            className={`group relative bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
              selectedRole === 'pharmacy' ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                薬局管理者
              </h2>
              <p className="text-gray-600 mb-6">
                在宅対応薬局の<br />
                管理者・薬剤師の方
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <span>ログインする</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* フッターリンク */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-gray-600">
            アカウントをお持ちでない方
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/doctor/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              <UserCircle2 className="w-5 h-5" />
              医師として新規登録
            </Link>
            <Link
              href="/pharmacy/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              薬局として新規登録
            </Link>
          </div>
        </div>

        {/* ホームに戻る */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}