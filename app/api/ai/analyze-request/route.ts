import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { requestData, pharmacyData } = body

    if (!requestData || !pharmacyData) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      )
    }

    const prompt = `
あなたは在宅対応薬局の業務を支援するAIアシスタントです。
以下の依頼内容を分析し、薬局が判断するための重要な情報を抽出してください。

依頼情報:
- 医療機関: ${requestData.doctor?.organization_name || '不明'}
- 依頼日時: ${new Date(requestData.created_at).toLocaleString('ja-JP')}

患者情報:
- 服用薬: ${requestData.patient_info?.medications?.map((m: any) => m.name).join('、') || 'なし'}
- 既往歴: ${requestData.patient_info?.conditions?.join('、') || 'なし'}
- 治療方針: ${requestData.patient_info?.treatment_plan || 'なし'}
- 備考: ${requestData.patient_info?.notes || 'なし'}

薬局情報:
- 現在の受入患者数: ${pharmacyData.accepted_patients_count}
- 最大受入可能数: ${pharmacyData.max_capacity || '無制限'}
- 24時間対応: ${pharmacyData.twenty_four_support ? '可能' : '不可'}
- クリーンルーム: ${pharmacyData.has_clean_room ? 'あり' : 'なし'}
- 麻薬取扱: ${pharmacyData.handles_narcotics ? '可能' : '不可'}

以下の観点で分析してください:
1. 緊急度（高/中/低）とその理由
2. 必要な対応能力（特殊な設備や資格が必要か）
3. 予想される訪問頻度
4. 受入推奨度（推奨/条件付き推奨/非推奨）とその理由
5. 注意すべきポイント

JSON形式で回答してください。
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは在宅対応薬局の業務を支援する専門的なAIアシスタントです。医療知識に基づいた正確な分析を行います。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('Error in request analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze request' },
      { status: 500 }
    )
  }
}