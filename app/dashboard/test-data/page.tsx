'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function TestDataPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function createTestData() {
    setLoading(true)
    try {
      const response = await fetch('/api/test/create-data', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('テストデータの作成が完了しました')
        console.log('作成されたデータ:', data)
        // ダッシュボードにリダイレクト
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        toast.error(data.error || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('エラー:', error)
      toast.error('テストデータの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">テストデータ作成</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">テストデータを作成</h2>
        <p className="text-gray-600 mb-6">
          以下のデータが作成されます：
        </p>
        
        <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">
          <li>会社名を「ホームドラッグコネクト株式会社」に更新</li>
          <li>東京駅前店（千代田区丸の内）</li>
          <li>新宿南口店（新宿区西新宿）</li>
          <li>新橋駅前店（港区新橋）- 24時間営業</li>
        </ul>
        
        <button
          onClick={createTestData}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '作成中...' : 'テストデータを作成'}
        </button>
      </div>
    </div>
  )
}