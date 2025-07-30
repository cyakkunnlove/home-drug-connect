import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    testEndpoint: '/api/debug/test-login',
    method: 'POST',
    body: {
      email: 'test-pharmacy-demo@gmail.com',
      password: 'Test1234!'
    },
    note: 'デバッグ用の簡易ログインテストエンドポイント'
  })
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // 直接Supabase Admin APIを使用してログイン試行
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase環境変数が設定されていません'
      }, { status: 500 })
    }
    
    // Supabase Auth REST APIを直接呼び出し
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
    
    const authData = await authResponse.json()
    
    if (!authResponse.ok) {
      return NextResponse.json({
        success: false,
        error: authData.error_description || authData.msg || 'ログインに失敗しました',
        details: authData,
        status: authResponse.status
      }, { status: authResponse.status })
    }
    
    return NextResponse.json({
      success: true,
      message: 'ログイン成功',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        role: authData.user?.role
      },
      access_token: authData.access_token ? 'トークンが正常に発行されました' : 'トークンなし'
    })
    
  } catch (error) {
    console.error('テストログインエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期せぬエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}