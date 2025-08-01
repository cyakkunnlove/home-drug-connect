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
      // Service role keyが設定されているかチェック
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Please set it in .env.local')
      }

      console.log('Creating user with Admin API:', { email, hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY })
      
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
        console.error('Supabase Admin API Error Details:', {
          message: adminError.message,
          status: adminError.status,
          name: adminError.name,
          stack: adminError.stack
        })
        throw adminError
      }
      
      if (!adminData.user) {
        throw new Error('ユーザー作成に失敗しました')
      }
      
      // 3. public.usersテーブルのレコードを確認・更新
      // トリガーが正常に動作していれば既にレコードが存在するはず
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminData.user.id)
        .single()
      
      if (!existingUser) {
        // トリガーが失敗した場合のフォールバック
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
      } else {
        // 既存レコードを更新（組織情報を追加）
        const { error: updateError } = await supabase
          .from('users')
          .update({
            organization_name: organizationName,
            phone,
            company_id: company.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', adminData.user.id)
        
        if (updateError) {
          console.error('User record update error:', updateError)
        }
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