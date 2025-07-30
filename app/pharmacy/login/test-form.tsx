'use client'

import { useState } from 'react'

export default function TestLoginForm() {
  const [email, setEmail] = useState('test-pharmacy-demo@gmail.com')
  const [password, setPassword] = useState('Test1234!')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTestLogin = async () => {
    console.log('Test login clicked', { email, password })
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      console.log('Sending request to /api/debug/test-direct')
      const response = await fetch('/api/debug/test-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      setResult(data)
    } catch (err) {
      console.error('Test login error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setResult({ error: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">テストログインフォーム</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">メール</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={handleTestLogin}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'テスト中...' : 'APIテスト実行'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">エラー: {error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            {result.success ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="text-sm font-medium text-green-700 mb-2">✅ ログイン成功！</h4>
                <div className="text-xs text-green-600 space-y-1">
                  <p>ユーザーID: {result.user?.id}</p>
                  <p>メール: {result.user?.email}</p>
                  <p>セッション: {result.session?.access_token}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-700 mb-2">❌ ログイン失敗</h4>
                <p className="text-xs text-red-600">{result.error}</p>
              </div>
            )}
            
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">詳細データを表示</summary>
              <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded border border-gray-200">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}