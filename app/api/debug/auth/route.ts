import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Auth] Starting auth debug check')
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({
        authenticated: false,
        error: authError.message,
        timestamp: new Date().toISOString()
      })
    }
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        error: 'No user found',
        timestamp: new Date().toISOString()
      })
    }
    
    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, created_at, updated_at')
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      },
      userData: userData || null,
      userError: userError || null,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
      }
    })
    
  } catch (error) {
    console.error('[Debug Auth] Error:', error)
    
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}