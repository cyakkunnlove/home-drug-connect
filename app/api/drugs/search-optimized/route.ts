import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10') // さらに少なく
    
    const headers = {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
    }
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        drugs: []
      }, { headers })
    }

    // 最適化されたテーブルから検索
    const { data: drugs, error } = await supabase
      .from('drugs_optimized')
      .select('*')
      .or(`generic_name.ilike.%${query}%,ingredient_name.ilike.%${query}%,brand_name.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('検索エラー:', error)
      return NextResponse.json(
        { error: '検索に失敗しました' },
        { status: 500 }
      )
    }

    // レスポンスを整形
    const formattedDrugs = drugs?.map(drug => ({
      id: drug.id,
      name: drug.generic_name,
      brand_name: drug.brand_name,
      brand_manufacturer: drug.brand_manufacturer,
      generic_manufacturers: drug.generic_manufacturers || [],
      dosage_form: drug.dosage_form,
      standard: drug.standard,
      has_brand: !!drug.brand_name,
      manufacturer_count: drug.generic_manufacturers?.length || 0
    })) || []

    return NextResponse.json({
      success: true,
      drugs: formattedDrugs,
      count: formattedDrugs.length
    }, { headers })

  } catch (error) {
    console.error('APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラー' },
      { status: 500 }
    )
  }
}