import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 現在のユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // usersテーブルからユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Failed to fetch user data',
        details: userError 
      }, { status: 500 })
    }
    
    // user_roleテーブルの値を確認
    const { data: roleEnums } = await supabase
      .rpc('get_enum_values', { enum_name: 'user_role' })
    
    return NextResponse.json({
      authUser: {
        id: user.id,
        email: user.email
      },
      userData: userData,
      availableRoles: roleEnums,
      currentRole: userData?.role,
      isDoctor: userData?.role === 'doctor'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error 
    }, { status: 500 })
  }
}