'use client'

import { useEffect, useState } from 'react'

export default function TestEnvPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/debug/test-registration')
      .then(res => res.json())
      .then(data => {
        setStatus(data)
        setLoading(false)
      })
      .catch(err => {
        setStatus({ error: err.message })
        setLoading(false)
      })
  }, [])
  
  const testRegistration = async () => {
    const testEmail = `test-${Date.now()}@example.com`
    const response = await fetch('/api/debug/test-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        role: 'pharmacy_admin'
      })
    })
    
    const result = await response.json()
    alert(JSON.stringify(result, null, 2))
  }
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">環境設定テスト</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">環境変数ステータス:</h2>
        <pre className="text-sm">{JSON.stringify(status, null, 2)}</pre>
      </div>
      
      <button
        onClick={testRegistration}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        登録テストを実行
      </button>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Public環境変数:</p>
        <ul className="list-disc ml-6">
          <li>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</li>
          <li>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</li>
          <li>GOOGLE_MAPS_API_KEY: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  )
}