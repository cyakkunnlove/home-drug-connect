'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface AuthDebugData {
  authenticated: boolean
  user?: any
  userData?: any
  userError?: any
  error?: string
  environment?: {
    nodeEnv: string
    hasOpenAI: boolean
    supabaseUrl: string
  }
  timestamp: string
}

export default function AuthDebug() {
  const [debugData, setDebugData] = useState<AuthDebugData | null>(null)
  const [loading, setLoading] = useState(false)

  const checkAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/auth')
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error('Debug auth check failed:', error)
      setDebugData({
        authenticated: false,
        error: 'Failed to check authentication',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <AlertTriangle className="h-5 w-5" />
          認証デバッグ情報
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <button 
          onClick={checkAuth} 
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '確認中...' : '認証状態を確認'}
        </button>

        {debugData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {debugData.authenticated ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                    認証済み
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                    未認証
                  </span>
                </>
              )}
            </div>

            {debugData.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  <strong>エラー:</strong> {debugData.error}
                </p>
              </div>
            )}

            {debugData.user && (
              <div className="space-y-2">
                <h4 className="font-medium">ユーザー情報（Auth）:</h4>
                <div className="p-3 bg-gray-50 rounded-md text-xs font-mono">
                  <pre>{JSON.stringify(debugData.user, null, 2)}</pre>
                </div>
              </div>
            )}

            {debugData.userData && (
              <div className="space-y-2">
                <h4 className="font-medium">ユーザー情報（DB）:</h4>
                <div className="p-3 bg-gray-50 rounded-md text-xs font-mono">
                  <pre>{JSON.stringify(debugData.userData, null, 2)}</pre>
                </div>
              </div>
            )}

            {debugData.userError && (
              <div className="space-y-2">
                <h4 className="font-medium">DBエラー:</h4>
                <div className="p-3 bg-red-50 rounded-md text-xs font-mono">
                  <pre>{JSON.stringify(debugData.userError, null, 2)}</pre>
                </div>
              </div>
            )}

            {debugData.environment && (
              <div className="space-y-2">
                <h4 className="font-medium">環境設定:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <span className={`px-2 py-1 rounded-md text-sm ${debugData.environment.nodeEnv === 'development' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {debugData.environment.nodeEnv}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-sm ${debugData.environment.hasOpenAI ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    OpenAI: {debugData.environment.hasOpenAI ? '設定済み' : '未設定'}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-sm ${debugData.environment.supabaseUrl === 'configured' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Supabase: {debugData.environment.supabaseUrl}
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              最終確認: {new Date(debugData.timestamp).toLocaleString('ja-JP')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}