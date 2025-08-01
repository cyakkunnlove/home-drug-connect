import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, hospitalName, department } = await request.json()
    
    console.log('Doctor registration attempt:', { email, name, hospitalName })
    
    // Service clientを使用（RLSをバイパス）
    const supabase = await createServiceClient()
    
    // 1. Admin APIでユーザーを作成
    try {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // メール確認をスキップ
        user_metadata: {
          role: 'doctor',
          name,
          hospital_name: hospitalName,
          department
        }
      })
      
      if (adminError) {
        throw adminError
      }
      
      if (!adminData.user) {
        throw new Error('ユーザー作成に失敗しました')
      }
      
      // 2. public.usersテーブルのレコードを確認
      // トリガーが正常に動作していれば既にレコードが存在するはず
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', adminData.user.id)
        .single()
      
      if (!existingUser && checkError?.code === 'PGRST116') {
        // トリガーが失敗した場合のフォールバック
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: adminData.user.id,
            email,
            role: 'doctor',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (userError) {
          console.error('User record creation error:', userError)
          // ロールバック
          await supabase.auth.admin.deleteUser(adminData.user.id)
          
          return NextResponse.json({
            error: 'ユーザー情報の保存に失敗しました',
            details: userError.message
          }, { status: 400 })
        }
      }
      
      // 3. doctorsテーブルにレコードを作成
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: adminData.user.id,
          name,
          phone,
          hospital_name: hospitalName,
          department,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (doctorError) {
        console.error('Doctor record creation error:', doctorError)
        // ロールバック
        await supabase.from('users').delete().eq('id', adminData.user.id)
        await supabase.auth.admin.deleteUser(adminData.user.id)
        
        return NextResponse.json({
          error: '医師情報の保存に失敗しました',
          details: doctorError.message
        }, { status: 400 })
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
        doctor,
        message: '登録が完了しました'
      })
      
    } catch (authErr: any) {
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