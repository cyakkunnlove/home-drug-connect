import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  
  // テストアカウントの情報
  const testEmail = 'test-pharmacy-' + Date.now() + '@example.com'
  const testPassword = 'TestPassword123!'
  const testCompanyName = 'テスト薬局株式会社 ' + new Date().toISOString().slice(0, 10)
  const testPhone = '03-' + Math.floor(Math.random() * 9000 + 1000) + '-' + Math.floor(Math.random() * 9000 + 1000)
  
  try {
    // 1. Authでユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
    
    if (!authData.user) {
      return NextResponse.json({ error: 'ユーザー作成に失敗しました' }, { status: 400 })
    }
    
    // 2. 会社を作成
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: testCompanyName,
        headquarters_phone: testPhone,
        headquarters_email: testEmail,
        status: 'active'
      })
      .select()
      .single()
    
    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 400 })
    }
    
    // 3. usersテーブルを更新
    const { error: updateError } = await supabase
      .from('users')
      .update({
        organization_name: testCompanyName,
        phone: testPhone,
        company_id: company.id
      })
      .eq('id', authData.user.id)
    
    if (updateError) {
      // 少し待ってリトライ
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { error: retryError } = await supabase
        .from('users')
        .update({
          organization_name: testCompanyName,
          phone: testPhone,
          company_id: company.id
        })
        .eq('id', authData.user.id)
      
      if (retryError) {
        return NextResponse.json({ error: 'ユーザー情報の更新に失敗しました' }, { status: 400 })
      }
    }
    
    // 4. テスト薬局を作成
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .insert({
        company_id: company.id,
        name: testCompanyName + ' 本店',
        address: '東京都千代田区丸の内1-1-1',
        formatted_address: '〒100-0005 東京都千代田区丸の内1-1-1',
        prefecture: '東京都',
        city: '千代田区',
        postal_code: '100-0005',
        phone: testPhone,
        email: testEmail,
        location: 'POINT(139.7647 35.6812)',
        latitude: 35.6812,
        longitude: 139.7647,
        twenty_four_support: true,
        holiday_support: true,
        emergency_support: true,
        has_clean_room: true,
        handles_narcotics: true,
        accepts_emergency: true,
        max_capacity: 20,
        current_capacity: 5,
        available_spots: 15,
        service_radius_km: 10,
        status: 'active'
      })
      .select()
      .single()
    
    if (pharmacyError) {
      return NextResponse.json({ error: pharmacyError.message }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      account: {
        email: testEmail,
        password: testPassword,
        companyName: testCompanyName,
        pharmacyName: pharmacy.name,
        phone: testPhone
      },
      message: 'テストアカウントが作成されました。メール確認は必要ありません。'
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'エラーが発生しました' },
      { status: 500 }
    )
  }
}