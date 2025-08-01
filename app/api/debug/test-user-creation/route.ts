import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    
    console.log('=== User Creation Debug Test ===')
    
    // ステップ1: Service clientが正しく初期化されているか
    console.log('Step 1: Service client check')
    console.log('- Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('- Service Role Key valid:', process.env.SUPABASE_SERVICE_ROLE_KEY !== 'YOUR_SERVICE_ROLE_KEY_HERE')
    
    // ステップ2: Admin APIのリストユーザーをテスト
    console.log('\nStep 2: Testing Admin API listUsers')
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })
    
    console.log('- List users success:', !listError)
    if (listError) {
      console.error('- List users error:', listError)
    }
    
    // ステップ3: テストユーザーの作成を試みる
    console.log('\nStep 3: Testing user creation')
    const testEmail = `debug-test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: 'pharmacy_admin',
        test: true
      }
    })
    
    console.log('- Create user success:', !createError)
    if (createError) {
      console.error('- Create user error:', {
        message: createError.message,
        status: createError.status,
        name: createError.name,
        code: createError.code,
        details: createError
      })
    }
    
    let deleteSuccess = false
    
    // ステップ4: 作成できた場合は削除
    if (createData?.user) {
      console.log('\nStep 4: Cleaning up test user')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(createData.user.id)
      deleteSuccess = !deleteError
      if (deleteError) {
        console.error('- Delete user error:', deleteError)
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      serviceRoleKeyCheck: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        valid: process.env.SUPABASE_SERVICE_ROLE_KEY !== 'YOUR_SERVICE_ROLE_KEY_HERE',
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
      },
      adminApiListUsers: {
        success: !listError,
        error: listError?.message || null,
        userCount: listData?.users?.length || 0
      },
      adminApiCreateUser: {
        success: !createError,
        error: createError?.message || null,
        errorDetails: createError || null,
        userId: createData?.user?.id || null,
        cleanedUp: deleteSuccess
      },
      debugInfo: {
        testEmail,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    })
  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}