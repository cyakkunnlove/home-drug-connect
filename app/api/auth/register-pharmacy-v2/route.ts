import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, organizationName, phone } = await request.json()
    
    console.log('Registration attempt v2:', { email, organizationName })
    
    // Service clientを使用（RLSをバイパス）
    const supabase = await createServiceClient()
    
    // 1. まずcompaniesテーブルに会社を作成
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
      return NextResponse.json({
        error: '組織情報の作成に失敗しました',
        details: companyError.message
      }, { status: 400 })
    }
    
    // 2. Admin APIでユーザーを作成（トリガーをバイパス）
    try {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // メール確認をスキップ
        user_metadata: {
          role: 'pharmacy_admin',
          company_id: company.id
        }
      })
      
      if (adminError) {
        throw adminError
      }
      
      if (!adminData.user) {
        throw new Error('ユーザー作成に失敗しました')
      }
      
      // 3. public.usersテーブルに直接レコードを作成
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: adminData.user.id,
          email,
          role: 'pharmacy_admin',
          organization_name: organizationName,
          phone,
          company_id: company.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (userError) {
        console.error('User record creation error:', userError)
        // ロールバック
        await supabase.from('companies').delete().eq('id', company.id)
        await supabase.auth.admin.deleteUser(adminData.user.id)
        
        return NextResponse.json({
          error: 'ユーザー情報の保存に失敗しました',
          details: userError.message
        }, { status: 400 })
      }
      
      // 4. セッションを作成
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
        user: adminData.user,
        company,
        message: '登録が完了しました'
      })
      
    } catch (authErr: any) {
      // Auth APIエラーの場合、会社を削除
      await supabase.from('companies').delete().eq('id', company.id)
      
      console.error('Auth Admin API error:', authErr)
      return NextResponse.json({
        error: 'ユーザー作成に失敗しました',
        details: authErr.message || String(authErr)
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}