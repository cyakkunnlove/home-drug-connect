import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    // ユーザーの会社情報を取得
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('company_id, companies(*)')
      .eq('id', user.id)
      .single()

    if (userDataError) {
      return NextResponse.json({ error: 'ユーザー情報取得エラー', details: userDataError })
    }

    // 会社IDで薬局を検索
    let pharmaciesByCompany = null
    let companyError = null
    if (userData?.company_id) {
      const result = await supabase
        .from('pharmacies')
        .select('*')
        .eq('company_id', userData.company_id)
      
      pharmaciesByCompany = result.data
      companyError = result.error
    }

    // ユーザーIDで薬局を検索（後方互換性）
    const { data: pharmaciesByUser, error: userPharmaciesError } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('user_id', user.id)

    // 全薬局を取得（デバッグ用）
    const { data: allPharmacies, count: totalCount } = await supabase
      .from('pharmacies')
      .select('id, name, company_id, user_id', { count: 'exact' })
      .limit(10)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        company_id: userData?.company_id,
        company_name: userData?.companies?.name
      },
      pharmacies: {
        byCompany: {
          count: pharmaciesByCompany?.length || 0,
          data: pharmaciesByCompany,
          error: companyError
        },
        byUser: {
          count: pharmaciesByUser?.length || 0,
          data: pharmaciesByUser,
          error: userPharmaciesError
        }
      },
      debug: {
        allPharmaciesCount: totalCount,
        samplePharmacies: allPharmacies
      }
    })
  } catch (error) {
    console.error('デバッグエラー:', error)
    return NextResponse.json({ error: 'デバッグエラー', details: error }, { status: 500 })
  }
}