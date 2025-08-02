import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// よく使われる薬剤のリスト（実際の使用頻度に基づいて調整）
const COMMON_DRUGS = [
  'アムロジピン',
  'ロキソプロフェン',
  'レバミピド',
  'ランソプラゾール',
  'メトホルミン',
  'アトルバスタチン',
  'アジルサルタン',
  'シタグリプチン',
  'プレガバリン',
  'デュロキセチン',
  'エスゾピクロン',
  'センノシド',
  'マグミット',
  'ビオフェルミン',
  'ムコスタ',
  'ガスター',
  'タケプロン',
  'ネキシウム',
  'パリエット',
  'クラビット'
]

export async function GET() {
  try {
    const supabase = await createClient()
    
    // キャッシュヘッダーを設定（1日間）
    const headers = {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'CDN-Cache-Control': 'max-age=86400'
    }

    // データベースから頻出薬剤を取得
    const { data: drugs, error } = await supabase
      .from('drugs')
      .select('code, name, name_kana, type, manufacturer')
      .or(COMMON_DRUGS.map(name => `name.ilike.%${name}%`).join(','))
      .limit(100)

    if (error) {
      console.error('Error fetching common drugs:', error)
      // エラー時も空配列を返してクライアントが動作するように
      return NextResponse.json(
        { success: true, drugs: [] },
        { headers }
      )
    }

    // 使用頻度の高い順にソート（実際の使用データがあれば活用）
    const sortedDrugs = drugs?.sort((a, b) => {
      // 先発品を優先
      if (a.type !== b.type) {
        return a.type === 'brand' ? -1 : 1
      }
      // 名前でソート
      return a.name.localeCompare(b.name, 'ja')
    }) || []

    return NextResponse.json(
      { 
        success: true, 
        drugs: sortedDrugs,
        cached: true
      },
      { headers }
    )

  } catch (error) {
    console.error('Error in common drugs endpoint:', error)
    return NextResponse.json(
      { success: true, drugs: [] },
      { 
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      }
    )
  }
}