import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()
    
    console.log('Registration attempt:', { email, role })
    
    // Supabaseクライアントを作成
    const supabase = await createClient()
    
    // 環境変数の確認
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('Service Role Key exists:', hasServiceKey)
    
    // 現在のユーザーを確認
    const { data: currentUser } = await supabase.auth.getUser()
    console.log('Current user:', currentUser)
    
    // サインアップを試行
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role || 'pharmacy_admin'
        }
      }
    })
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        error: authError.message,
        details: {
          code: authError.code,
          status: authError.status,
          name: authError.name
        }
      }, { status: 400 })
    }
    
    console.log('Auth success:', authData.user?.id)
    
    // ユーザーレコードが作成されているか確認
    if (authData.user) {
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      console.log('User record:', userData)
      console.log('User error:', userError)
      
      return NextResponse.json({
        success: true,
        authUser: authData.user,
        userRecord: userData,
        userError: userError
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Registration initiated'
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      error: 'Unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // データベース接続テスト
    const { data: test, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    // RLSポリシーの確認
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies', {
        table_name: 'users'
      })
      .select('*')
    
    return NextResponse.json({
      status: 'ready',
      database: {
        connected: !testError,
        error: testError?.message
      },
      environment: {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}