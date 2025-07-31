import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Session] Starting session check')
    
    // Get cookies info
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase')
    )
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get user data if authenticated
    let userData = null
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      userData = data
    }
    
    return NextResponse.json({
      cookies: {
        total: allCookies.length,
        authCookies: authCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite
        }))
      },
      session: {
        exists: !!session,
        expiresAt: session?.expires_at,
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        error: userError?.message
      },
      userData: userData || null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[Debug Session] Error:', error)
    
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}