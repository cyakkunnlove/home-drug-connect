import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    
    // 1. Service Clientが正しく動作するか確認
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 2. public.usersテーブルへのアクセスを確認
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 3. companiesテーブルへのアクセスを確認
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, status')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 4. admin.createUserの動作を確認（ドライラン）
    const testEmail = `test-check-${Date.now()}@example.com`
    let testUser = null
    let adminError = null
    
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          role: 'pharmacy_admin'
        }
      })
      testUser = data
      adminError = error
      
      // テストユーザーを削除
      if (data?.user) {
        await supabase.auth.admin.deleteUser(data.user.id)
      }
    } catch (e) {
      adminError = e
    }
    
    return NextResponse.json({
      serviceClientStatus: 'OK',
      authUsers: {
        count: authUsers?.length || 0,
        error: authError?.message || null,
        data: authUsers?.map(u => ({
          id: u.id,
          email: u.email.substring(0, 3) + '***',
          created: u.created_at
        }))
      },
      publicUsers: {
        count: publicUsers?.length || 0,
        error: publicError?.message || null,
        data: publicUsers?.map(u => ({
          id: u.id,
          email: u.email.substring(0, 3) + '***',
          role: u.role,
          created: u.created_at
        }))
      },
      companies: {
        count: companies?.length || 0,
        error: companiesError?.message || null,
        data: companies
      },
      adminApiTest: {
        testEmail,
        success: !!testUser?.user,
        error: adminError?.message || String(adminError),
        userId: testUser?.user?.id
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Service client test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}