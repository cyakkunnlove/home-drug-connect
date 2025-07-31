'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DeleteAccountSection() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDeleteAccount = async () => {
    if (confirmText !== 'アカウントを削除する') {
      toast.error('確認テキストが一致しません')
      return
    }

    if (!password) {
      toast.error('パスワードを入力してください')
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アカウント削除に失敗しました')
      }

      toast.success('アカウントが正常に削除されました')
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      console.error('Account deletion error:', error)
      toast.error(error instanceof Error ? error.message : 'エラーが発生しました')
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Trash2 className="w-5 h-5 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900">アカウントの削除</h2>
      </div>
      
      {!showConfirmation ? (
        <div>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="mb-2">アカウントを削除すると、以下のデータが完全に削除されます：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>プロフィール情報</li>
                <li>薬局情報（薬局管理者の場合）</li>
                <li>すべての依頼履歴</li>
                <li>すべての問い合わせ履歴</li>
                <li>サブスクリプション情報</li>
              </ul>
              <p className="mt-2 font-semibold text-red-600">この操作は取り消すことができません。</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowConfirmation(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            アカウントを削除する
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-red-300">
            <p className="text-sm text-gray-700 mb-4">
              本当にアカウントを削除しますか？確認のため、以下の情報を入力してください。
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="現在のパスワードを入力"
                />
              </div>
              
              <div>
                <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
                  確認テキスト
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  「<span className="font-semibold">アカウントを削除する</span>」と入力してください
                </p>
                <input
                  id="confirmText"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="アカウントを削除する"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmText !== 'アカウントを削除する' || !password}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isDeleting ? '削除中...' : 'アカウントを完全に削除する'}
            </button>
            
            <button
              onClick={() => {
                setShowConfirmation(false)
                setPassword('')
                setConfirmText('')
              }}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}