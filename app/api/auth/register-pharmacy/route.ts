import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, organizationName, phone } = await request.json()
    
    // Service clientを使用（RLSをバイパス）
    const supabase = await createServiceClient()
    
    // 1. Supabase Authでユーザーを作成（確認メールなし）
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        data: {
          role: 'pharmacy_admin'
        }
      }
    })
    
    if (authError) {
      console.error('Auth error:', authError)
      
      // "Database error creating new user"の場合は、Admin APIを試す
      if (authError.message.includes('Database error')) {
        try {
          const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // メール確認をスキップ
            user_metadata: {
              role: 'pharmacy_admin'
            }
          })
          
          if (adminError) throw adminError
          
          // Admin APIが成功した場合は、authDataの代わりにadminDataを使用
          authData.user = adminData.user
        } catch (adminErr: any) {
          console.error('Admin API error:', adminErr)
          return NextResponse.json({
            error: 'ユーザー作成に失敗しました。別のメールアドレスをお試しください。',
            details: adminErr.message || String(adminErr)
          }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }
    
    if (!authData?.user) {
      return NextResponse.json({
        error: 'ユーザー作成に失敗しました'
      }, { status: 400 })
    }
    
    // 2. 会社を作成
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: organizationName,
        headquarters_phone: phone,
        headquarters_email: email,
        status: 'active',
      })
      .select()
      .single()
    
    if (companyError) {
      console.error('Company creation error:', companyError)
      // ユーザーを削除
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        error: '組織情報の作成に失敗しました'
      }, { status: 400 })
    }
    
    // 3. usersテーブルに直接レコードを作成/更新
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        role: 'pharmacy_admin',
        organization_name: organizationName,
        phone,
        company_id: company.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (userError) {
      console.error('User record error:', userError)
      // クリーンアップ
      await supabase.from('companies').delete().eq('id', company.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        error: 'ユーザー情報の保存に失敗しました'
      }, { status: 400 })
    }
    
    // 4. セッションを作成してログイン状態にする
    const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (sessionError) {
      console.error('Session creation error:', sessionError)
      // 登録は成功しているので、エラーは返さない
    }
    
    return NextResponse.json({
      success: true,
      user: authData.user,
      company,
      message: '登録が完了しました'
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      error: 'サーバーエラーが発生しました'
    }, { status: 500 })
  }
}