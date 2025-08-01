import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const results: any = {
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
        urlTrimmedLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().length,
      },
      tests: {}
    }
    
    // Test 1: Anon client database connection
    try {
      const anonClient = await createClient()
      const { error: anonError } = await anonClient
        .from('users')
        .select('count')
        .limit(1)
        .single()
      
      results.tests.anonDbConnection = {
        success: !anonError,
        error: anonError?.message
      }
    } catch (e) {
      results.tests.anonDbConnection = {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      }
    }
    
    // Test 2: Service client database connection
    try {
      const serviceClient = await createServiceClient()
      const { error: serviceError } = await serviceClient
        .from('users')
        .select('count')
        .limit(1)
        .single()
      
      results.tests.serviceDbConnection = {
        success: !serviceError,
        error: serviceError?.message
      }
    } catch (e) {
      results.tests.serviceDbConnection = {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      }
    }
    
    // Test 3: Auth health check
    try {
      const client = await createClient()
      const { data: session, error: authError } = await client.auth.getSession()
      
      results.tests.authHealth = {
        success: !authError,
        hasSession: !!session?.session,
        error: authError?.message
      }
    } catch (e) {
      results.tests.authHealth = {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      }
    }
    
    // Test 4: Check trigger function exists
    try {
      const serviceClient = await createServiceClient()
      const { data: functions, error: funcError } = await serviceClient
        .rpc('pg_get_functiondef', {
          func_oid: `'public.handle_new_user'::regproc::oid`
        })
      
      results.tests.triggerFunction = {
        exists: !funcError && !!functions,
        error: funcError?.message
      }
    } catch (e) {
      results.tests.triggerFunction = {
        exists: false,
        error: 'Could not check function'
      }
    }
    
    // Test 5: Check auth.users table access
    try {
      const serviceClient = await createServiceClient()
      const { data: authUsers, error: authUsersError } = await serviceClient
        .from('auth.users')
        .select('id')
        .limit(1)
      
      results.tests.authUsersAccess = {
        success: !authUsersError,
        error: authUsersError?.message
      }
    } catch (e) {
      results.tests.authUsersAccess = {
        success: false,
        error: e instanceof Error ? e.message : String(e)
      }
    }
    
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({
      error: 'Status check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}