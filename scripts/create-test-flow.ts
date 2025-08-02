import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestFlow() {
  console.log('🚀 依頼フローの検証を開始します...\n')

  try {
    // 1. サンプル薬局アカウントを作成
    console.log('1️⃣ サンプル薬局アカウントを作成中...')
    const pharmacyEmail = `test-pharmacy-${Date.now()}@example.com`
    const pharmacyPassword = 'TestPassword123!'
    
    const { data: pharmacyAuth, error: pharmacyAuthError } = await supabase.auth.admin.createUser({
      email: pharmacyEmail,
      password: pharmacyPassword,
      email_confirm: true,
      user_metadata: {}
    })

    if (pharmacyAuthError) throw pharmacyAuthError

    // 薬局のユーザー情報を作成
    const { error: pharmacyUserError } = await supabase
      .from('users')
      .insert({
        id: pharmacyAuth.user.id,
        email: pharmacyEmail,
        role: 'pharmacy_admin',
        organization_name: 'テスト薬局株式会社',
        phone: '03-1234-5678'
      })

    if (pharmacyUserError) throw pharmacyUserError

    // 薬局情報を作成
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .insert({
        user_id: pharmacyAuth.user.id,
        name: 'テスト在宅対応薬局',
        address: '東京都渋谷区渋谷1-1-1',
        latitude: 35.6595,
        longitude: 139.7004,
        phone: '03-1234-5678',
        email: pharmacyEmail,
        twenty_four_support: true,
        holiday_support: true,
        has_clean_room: true,
        handles_narcotics: true,
        accepted_patients_count: 5,
        max_capacity: 20,
        service_area: '渋谷区、新宿区、世田谷区',
        website_url: 'https://test-pharmacy.example.com',
        status: 'active'
      })
      .select()
      .single()

    if (pharmacyError) throw pharmacyError

    console.log(`✅ 薬局アカウント作成完了:`)
    console.log(`   Email: ${pharmacyEmail}`)
    console.log(`   Password: ${pharmacyPassword}`)
    console.log(`   薬局名: ${pharmacy.name}`)
    console.log(`   薬局ID: ${pharmacy.id}\n`)

    // 2. サンプル医師アカウントを作成
    console.log('2️⃣ サンプル医師アカウントを作成中...')
    const doctorEmail = `test-doctor-${Date.now()}@example.com`
    const doctorPassword = 'TestPassword123!'
    
    const { data: doctorAuth, error: doctorAuthError } = await supabase.auth.admin.createUser({
      email: doctorEmail,
      password: doctorPassword,
      email_confirm: true
    })

    if (doctorAuthError) throw doctorAuthError

    // 医師のユーザー情報を作成
    const { error: doctorUserError } = await supabase
      .from('users')
      .insert({
        id: doctorAuth.user.id,
        email: doctorEmail,
        role: 'doctor',
        name: 'テスト 太郎',
        organization_name: 'テスト病院',
        clinic_name: 'テスト病院',
        medical_license_number: '第123456号',
        phone: '03-9876-5432'
      })

    if (doctorUserError) throw doctorUserError

    console.log(`✅ 医師アカウント作成完了:`)
    console.log(`   Email: ${doctorEmail}`)
    console.log(`   Password: ${doctorPassword}`)
    console.log(`   医師名: テスト 太郎`)
    console.log(`   所属: テスト病院\n`)

    // 3. 医師から薬局への依頼を作成
    console.log('3️⃣ 医師から薬局への依頼を作成中...')
    
    const patientInfo = {
      medications: [
        { name: 'アムロジピン錠5mg', dosage: '1日1回朝食後', frequency: '毎日' },
        { name: 'メトホルミン塩酸塩錠250mg', dosage: '1日2回朝夕食後', frequency: '毎日' },
        { name: 'ロキソプロフェンナトリウム錠60mg', dosage: '疼痛時', frequency: '頓用' }
      ],
      conditions: ['高血圧症', '2型糖尿病', '変形性膝関節症'],
      treatment_plan: '血圧と血糖値のコントロールを継続しながら、膝の痛みに対して適宜鎮痛剤を使用。月1回の訪問で服薬指導と残薬確認を実施予定。',
      notes: '独居の高齢者で、薬の管理に不安があるため、お薬カレンダーの使用を推奨。'
    }

    const aiDocument = `件名: 在宅医療患者の薬剤管理依頼

患者基本情報:
- 住所: 東京都渋谷区
- 年齢: 75歳
- 性別: 男性

現在の状況:
独居の高齢者で、複数の慢性疾患を抱えています。服薬管理に不安があるため、定期的な訪問薬剤指導をお願いしたく依頼いたします。

処方内容:
1. アムロジピン錠5mg - 1日1回朝食後
2. メトホルミン塩酸塩錠250mg - 1日2回朝夕食後
3. ロキソプロフェンナトリウム錠60mg - 疼痛時頓用

既往歴:
- 高血圧症
- 2型糖尿病
- 変形性膝関節症

薬局への依頼事項:
- 月1回の定期訪問での服薬指導
- 残薬確認と服薬カレンダーの管理
- 副作用モニタリング
- 必要に応じた医師への報告

訪問希望:
平日の午前中を希望

よろしくお願いいたします。
テスト病院 テスト太郎`

    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        doctor_id: doctorAuth.user.id,
        pharmacy_id: pharmacy.id,
        doctor_info: {
          name: 'テスト 太郎',
          organization: 'テスト病院',
          email: doctorEmail
        },
        patient_info: patientInfo,
        ai_document: aiDocument,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) throw requestError

    console.log(`✅ 依頼作成完了:`)
    console.log(`   依頼ID: ${request.id}`)
    console.log(`   ステータス: ${request.status}`)
    console.log(`   薬剤数: ${patientInfo.medications.length}種類\n`)

    // 検証手順を表示
    console.log('📋 検証手順:')
    console.log('=====================================')
    console.log('1. 薬局側でログイン:')
    console.log(`   URL: https://home-drug-connect.vercel.app/pharmacy/login`)
    console.log(`   Email: ${pharmacyEmail}`)
    console.log(`   Password: ${pharmacyPassword}`)
    console.log('')
    console.log('2. ダッシュボードで新着依頼を確認')
    console.log('   - 通知ベルアイコンに新着表示')
    console.log('   - 依頼一覧に「新着」バッジ付きで表示')
    console.log('   - AI要約で内容を即座に把握')
    console.log('')
    console.log('3. 依頼の詳細を確認')
    console.log('   - 患者情報の確認')
    console.log('   - AI推奨事項の確認')
    console.log('   - 受入可能数の確認')
    console.log('')
    console.log('4. 承認または拒否')
    console.log('   - ワンクリック承認/拒否')
    console.log('   - テンプレート使用可能')
    console.log('   - カスタムメッセージ追加可能')
    console.log('')
    console.log('5. 医師側で結果を確認:')
    console.log(`   URL: https://home-drug-connect.vercel.app/doctor/login`)
    console.log(`   Email: ${doctorEmail}`)
    console.log(`   Password: ${doctorPassword}`)
    console.log('=====================================')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプトを実行
createTestFlow()