import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // ユーザー情報を確認
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // ロールに応じて適切なリダイレクト先を決定
    let redirectTo = '/dashboard'
    if (userData?.role === 'doctor') {
      redirectTo = '/doctor'
    } else if (userData?.role === 'admin') {
      redirectTo = '/admin'
    }

    return NextResponse.json({
      success: true,
      user: userData,
      redirectTo
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました。' },
      { status: 500 }
    )
  }
}