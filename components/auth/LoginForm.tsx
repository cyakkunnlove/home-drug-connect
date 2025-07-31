'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'ログインに失敗しました。')
        setIsLoading(false)
        return
      }
      
      if (data.success && data.redirectTo) {
        // ログイン成功時の処理
        console.log('ログイン成功、リダイレクト中...')
        // まずページをリフレッシュしてから遷移
        window.location.href = data.redirectTo
      }
    } catch (error) {
      console.error('ログインエラー:', error)
      setError('ログイン処理中にエラーが発生しました。')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
          パスワードを忘れた方
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'ログイン中...' : 'ログイン'}
      </button>

      <div className="text-center text-sm text-gray-600 space-y-2">
        <p>
          薬局として登録する場合は{' '}
          <Link href="/pharmacy/register" className="font-medium text-blue-600 hover:text-blue-500">
            薬局新規登録
          </Link>
        </p>
        <p>
          医師としてログインする場合は{' '}
          <Link href="/doctor/login" className="font-medium text-green-600 hover:text-green-500">
            医師ログイン
          </Link>
        </p>
        <p>
          医師として登録する場合は{' '}
          <Link href="/doctor/register" className="font-medium text-green-600 hover:text-green-500">
            医師新規登録
          </Link>
        </p>
      </div>
    </form>
  )
}