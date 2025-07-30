import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// .env.localファイルを読み込み
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

// 環境変数から設定を読み込み
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定')
  process.exit(1)
}

// Service Roleキーを使用してクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestAccount() {
  console.log('テストアカウントを作成中...')
  
  // テストアカウントの情報
  const testEmail = 'test-pharmacy@example.com'
  const testPassword = 'TestPassword123!'
  const testCompanyName = 'テスト薬局株式会社'
  const testPhone = '03-1234-5678'
  
  try {
    // 1. Authでユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        organizationName: testCompanyName,
        phone: testPhone
      }
    })
    
    if (authError) {
      console.error('ユーザー作成エラー:', authError)
      return
    }
    
    console.log('Authユーザーが作成されました:', authData.user?.id)
    
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
      console.error('会社作成エラー:', companyError)
      return
    }
    
    console.log('会社が作成されました:', company.id)
    
    // 3. usersテーブルを更新
    const { error: updateError } = await supabase
      .from('users')
      .update({
        organization_name: testCompanyName,
        phone: testPhone,
        company_id: company.id
      })
      .eq('id', authData.user?.id)
    
    if (updateError) {
      console.error('ユーザー更新エラー:', updateError)
      return
    }
    
    // 4. テスト薬局を作成
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .insert({
        company_id: company.id,
        name: 'テスト薬局 本店',
        address: '東京都千代田区丸の内1-1-1',
        formatted_address: '東京都千代田区丸の内1-1-1',
        prefecture: '東京都',
        city: '千代田区',
        postal_code: '100-0005',
        phone: '03-1234-5678',
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
      console.error('薬局作成エラー:', pharmacyError)
      return
    }
    
    console.log('薬局が作成されました:', pharmacy.id)
    
    console.log('\n=== テストアカウント作成完了 ===')
    console.log('メールアドレス:', testEmail)
    console.log('パスワード:', testPassword)
    console.log('会社名:', testCompanyName)
    console.log('薬局名:', pharmacy.name)
    console.log('================================\n')
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

// スクリプトを実行
createTestAccount()