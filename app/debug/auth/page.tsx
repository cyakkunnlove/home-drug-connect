import { createClient } from '@/lib/supabase/server'

export default async function DebugAuthPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  let userData = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    userData = data
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">認証デバッグ情報</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Auth User</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Users Table Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">リダイレクト先</h2>
          <p className="mb-2">ユーザーロール: <strong>{userData?.role || '未設定'}</strong></p>
          <p>推奨リダイレクト先: <strong>{userData?.role === 'doctor' ? '/doctor' : '/dashboard'}</strong></p>
        </div>
      </div>
    </div>
  )
}