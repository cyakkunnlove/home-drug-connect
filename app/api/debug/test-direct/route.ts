import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('環境変数確認:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl,
    })
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase環境変数が設定されていません'
      }, { status: 500 })
    }
    
    // 直接Supabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // ログイン試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('ログインエラー:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          status: error.status,
          name: error.name,
          __isAuthError: error.__isAuthError,
          stack: error.stack,
        }
      }, { status: 400 })
    }
    
    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'ログイン成功',
      user: {
        id: data.user.id,
        email: data.user.email,
        userData: userData,
      },
      session: {
        access_token: data.session?.access_token ? 'トークンあり' : 'トークンなし',
        expires_at: data.session?.expires_at,
      }
    })
    
  } catch (error) {
    console.error('テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期せぬエラーが発生しました',
      details: {
        message: error instanceof Error ? error.message : JSON.stringify(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      }
    }, { status: 500 })
  }
}