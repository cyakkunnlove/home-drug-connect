import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = await createClient()
    
    console.log('デバッグ: ログイン試行開始', { email })
    
    // 1. Supabase接続テスト
    const { data: testData } = await supabase.from('users').select('count').limit(1)
    console.log('デバッグ: Supabase接続テスト', { success: !!testData })
    
    // 2. ユーザー認証
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('デバッグ: 認証エラー', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
      })
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          status: error.status,
          name: error.name,
        }
      }, { status: 400 })
    }
    
    console.log('デバッグ: 認証成功', { userId: data.user?.id })
    
    // 3. ユーザーデータの確認
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (userError) {
      console.error('デバッグ: ユーザーデータエラー', userError)
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        userData: userData,
      }
    })
    
  } catch (error) {
    console.error('デバッグ: 予期せぬエラー', error)
    return NextResponse.json({
      success: false,
      error: '予期せぬエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}