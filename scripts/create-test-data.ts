import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = 'https://hrbsbdyutqwdxfartyzz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYnNiZHl1dHF3ZHhmYXJ0eXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTY3MTcsImV4cCI6MjA2OTQzMjcxN30.vSGlWeY6vxB1oDP48DGTRqpNgU36viWq4CE9RROuDRE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestData() {
  console.log('テストデータの作成を開始します...')

  try {
    // テストアカウントでログイン
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    })

    if (authError) {
      console.error('ログインエラー:', authError)
      return
    }

    console.log('ログイン成功:', authData.user?.email)

    // 会社情報を更新
    const companyId = '293712ed-8a6a-493a-909c-60b387237fb2'
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .update({
        name: 'ホームドラッグコネクト株式会社',
        description: '在宅医療に特化した薬局チェーンです。24時間対応可能な薬剤師が常駐し、患者様の自宅への医薬品配送サービスを提供しています。',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single()

    if (companyError) {
      console.error('会社情報更新エラー:', companyError)
    } else {
      console.log('会社情報を更新しました:', companyData)
    }

    // 薬局データを作成
    const pharmacies = [
      {
        name: 'ホームドラッグコネクト東京駅前店',
        postal_code: '100-0005',
        prefecture: '東京都',
        city: '千代田区',
        address_line1: '丸の内1-9-1',
        address_line2: '東京駅一番街B1F',
        phone: '03-1234-5678',
        fax: '03-1234-5679',
        email: 'tokyo@homedrug-connect.com',
        business_hours: {
          monday: { open: '09:00', close: '22:00' },
          tuesday: { open: '09:00', close: '22:00' },
          wednesday: { open: '09:00', close: '22:00' },
          thursday: { open: '09:00', close: '22:00' },
          friday: { open: '09:00', close: '22:00' },
          saturday: { open: '10:00', close: '20:00' },
          sunday: { open: '10:00', close: '20:00' }
        },
        is_24_hours: false,
        has_parking: true,
        services: {
          home_visit: true,
          online_consultation: true,
          prescription_delivery: true,
          emergency_response: true
        },
        specialties: ['在宅医療', '緩和ケア', '認知症ケア'],
        latitude: 35.6812,
        longitude: 139.7671,
        company_id: companyId,
        user_id: authData.user.id
      },
      {
        name: 'ホームドラッグコネクト新宿南口店',
        postal_code: '160-0023',
        prefecture: '東京都',
        city: '新宿区',
        address_line1: '西新宿1-1-3',
        address_line2: '新宿ミロード2F',
        phone: '03-2345-6789',
        fax: '03-2345-6790',
        email: 'shinjuku@homedrug-connect.com',
        business_hours: {
          monday: { open: '08:00', close: '23:00' },
          tuesday: { open: '08:00', close: '23:00' },
          wednesday: { open: '08:00', close: '23:00' },
          thursday: { open: '08:00', close: '23:00' },
          friday: { open: '08:00', close: '23:00' },
          saturday: { open: '09:00', close: '22:00' },
          sunday: { open: '09:00', close: '22:00' }
        },
        is_24_hours: false,
        has_parking: false,
        services: {
          home_visit: true,
          online_consultation: true,
          prescription_delivery: true,
          emergency_response: true
        },
        specialties: ['在宅医療', '糖尿病ケア', '高血圧管理'],
        latitude: 35.6896,
        longitude: 139.7006,
        company_id: companyId,
        user_id: authData.user.id
      },
      {
        name: 'ホームドラッグコネクト新橋駅前店',
        postal_code: '105-0004',
        prefecture: '東京都',
        city: '港区',
        address_line1: '新橋2-16-1',
        address_line2: 'ニュー新橋ビル1F',
        phone: '03-3456-7890',
        fax: '03-3456-7891',
        email: 'shimbashi@homedrug-connect.com',
        business_hours: {
          monday: { open: '00:00', close: '00:00' },
          tuesday: { open: '00:00', close: '00:00' },
          wednesday: { open: '00:00', close: '00:00' },
          thursday: { open: '00:00', close: '00:00' },
          friday: { open: '00:00', close: '00:00' },
          saturday: { open: '00:00', close: '00:00' },
          sunday: { open: '00:00', close: '00:00' }
        },
        is_24_hours: true,
        has_parking: true,
        services: {
          home_visit: true,
          online_consultation: true,
          prescription_delivery: true,
          emergency_response: true
        },
        specialties: ['在宅医療', '24時間対応', '緊急往診'],
        latitude: 35.6675,
        longitude: 139.7562,
        company_id: companyId,
        user_id: authData.user.id
      }
    ]

    // 薬局を一つずつ作成
    for (const pharmacy of pharmacies) {
      const { data, error } = await supabase
        .from('pharmacies')
        .insert(pharmacy)
        .select()
        .single()

      if (error) {
        console.error(`薬局作成エラー (${pharmacy.name}):`, error)
      } else {
        console.log(`薬局を作成しました: ${pharmacy.name}`)
      }
    }

    console.log('テストデータの作成が完了しました！')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

// 実行
createTestData()