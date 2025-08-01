import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, organizationName, phone } = await request.json()
    
    console.log('Direct signup test:', { email, organizationName })
    
    // Service clientを使用
    const serviceClient = await createServiceClient()
    
    // まずAuthでユーザーを作成
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'pharmacy_admin'
      }
    })
    
    if (authError) {
      console.error('Auth Admin API error:', authError)
      return NextResponse.json({
        error: authError.message,
        details: {
          code: authError.code,
          name: authError.name
        }
      }, { status: 400 })
    }
    
    if (!authData.user) {
      return NextResponse.json({
        error: 'User creation failed',
        details: 'No user data returned'
      }, { status: 400 })
    }
    
    // 会社を作成
    const { data: company, error: companyError } = await serviceClient
      .from('companies')
      .insert({
        name: organizationName || `Test Company ${Date.now()}`,
        headquarters_phone: phone || '03-1234-5678',
        headquarters_email: email,
        status: 'active',
      })
      .select()
      .single()
    
    if (companyError) {
      console.error('Company creation error:', companyError)
      // ユーザーを削除
      await serviceClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        error: 'Company creation failed',
        details: companyError
      }, { status: 400 })
    }
    
    // usersテーブルにレコードを作成（トリガーが動作しない場合の対策）
    const { data: userRecord, error: userError } = await serviceClient
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        role: 'pharmacy_admin',
        organization_name: organizationName || company.name,
        phone: phone || '03-1234-5678',
        company_id: company.id
      })
      .select()
      .single()
    
    if (userError) {
      console.error('User record creation error:', userError)
      // クリーンアップ
      await serviceClient.from('companies').delete().eq('id', company.id)
      await serviceClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        error: 'User record creation failed',
        details: userError
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      authUser: authData.user,
      company,
      userRecord
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      error: 'Unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}