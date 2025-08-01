'use client'

import { useState } from 'react'
import { signUp } from '@/lib/auth/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Building2, Phone, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setIsLoading(false)
      return
    }
    
    // 新しいAPIエンドポイントを使用
    try {
      const response = await fetch('/api/auth/register-pharmacy-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          organizationName: formData.get('organizationName'),
          phone: formData.get('phone'),
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '登録に失敗しました')
      }
      
      // 成功時は成功メッセージを表示してからリダイレクト
      setSuccess(true)
      setIsLoading(false)
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 p-8 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-16 h-16 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">登録が完了しました！</h3>
          <p className="text-sm text-green-700 text-center">
            アカウントが正常に作成されました。<br />
            3秒後にダッシュボードへ移動します...
          </p>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
          会社名
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="organizationName"
            name="organizationName"
            type="text"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="株式会社〇〇ファーマシー"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          メールアドレス
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="pharmacy@example.com"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          電話番号
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="03-1234-5678"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          パスワード
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="6文字以上"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          パスワード（確認）
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="もう一度入力"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? '登録中...' : '新規登録'}
      </button>

      <p className="text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/pharmacy/login" className="font-medium text-blue-600 hover:text-blue-500">
          ログイン
        </Link>
      </p>
    </form>
  )
}