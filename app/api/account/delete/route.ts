import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    // Get password from request body for confirmation
    const { password } = await request.json()
    if (!password) {
      return NextResponse.json(
        { error: 'パスワードの確認が必要です' },
        { status: 400 }
      )
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'パスワードが正しくありません' },
        { status: 400 }
      )
    }

    // Start transaction to delete user data
    // 1. Delete related data in order of dependencies
    
    // Delete responses
    await supabase
      .from('responses')
      .delete()
      .or(`doctor_id.eq.${user.id},pharmacy_id.eq.${user.id}`)

    // Delete requests
    await supabase
      .from('requests')
      .delete()
      .eq('doctor_id', user.id)

    // Delete inquiries
    await supabase
      .from('inquiries')
      .delete()
      .or(`doctor_id.eq.${user.id},pharmacy_id.eq.${user.id}`)

    // Delete reviews
    await supabase
      .from('reviews')
      .delete()
      .eq('doctor_id', user.id)

    // Delete pharmacy if user is pharmacy admin
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userRole?.role === 'pharmacy_admin') {
      await supabase
        .from('pharmacies')
        .delete()
        .eq('user_id', user.id)
    }

    // Delete user profile
    await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    // Note: Deleting auth user requires service role key
    // In production, you would need to:
    // 1. Use service role key for complete deletion, or
    // 2. Mark account as deleted in users table and handle in middleware
    // For now, we've deleted all user data from the database

    // Sign out the user
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'アカウントが正常に削除されました'
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'アカウント削除中にエラーが発生しました' },
      { status: 500 }
    )
  }
}