import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Service Role Test ===')
    console.log('ENV Check:')
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('- Key prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...')
    console.log('- Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)
    
    const supabase = await createServiceClient()
    
    // テスト1: auth.usersテーブルにアクセスできるか
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)
    
    // テスト2: Admin APIが使えるか
    let adminApiWorks = false
    let adminApiError = null
    
    try {
      // Admin APIのテスト（実際にユーザーは作成しない）
      const testEmail = `test-admin-api-${Date.now()}@example.com`
      const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      })
      
      if (!error) {
        adminApiWorks = true
      } else {
        adminApiError = error
      }
    } catch (e) {
      adminApiError = e
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      serviceRoleKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyValid: process.env.SUPABASE_SERVICE_ROLE_KEY !== 'YOUR_SERVICE_ROLE_KEY_HERE',
      authTableAccess: {
        success: !authError,
        error: authError?.message || null
      },
      adminApiAccess: {
        success: adminApiWorks,
        error: adminApiError?.message || String(adminApiError)
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}