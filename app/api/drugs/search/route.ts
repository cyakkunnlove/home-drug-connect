import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '20') // デフォルトを20に削減
    
    // キャッシュヘッダーを設定（5分間）
    const headers = {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
    }
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        drugs: []
      }, { headers })
    }

    // Use the search_drugs function we created in the database
    const { data: drugs, error: searchError } = await supabase
      .rpc('search_drugs', {
        search_query: query,
        limit_count: Math.min(limit, 30) // Cap at 30 for performance
      })

    if (searchError) {
      console.error('Error searching drugs:', searchError)
      
      // Fallback to basic search if trigram search fails
      const { data: fallbackDrugs, error: fallbackError } = await supabase
        .from('drugs')
        .select('code, name, name_kana, type')
        .or(`name.ilike.%${query}%,name_kana.ilike.%${query}%`)
        .limit(limit)

      if (fallbackError) {
        return NextResponse.json(
          { error: 'Failed to search drugs' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        drugs: fallbackDrugs || [],
        fallback: true
      }, { headers })
    }

    return NextResponse.json({
      success: true,
      drugs: drugs || []
    }, { headers })

  } catch (error) {
    console.error('Error in drug search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}