import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// OpenAI APIキーが設定されていない場合の処理を追加
const openaiApiKey = process.env.OPENAI_API_KEY

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null

interface GenerateRequestBody {
  pharmacyName: string
  doctorInfo?: {
    name?: string
    organization?: string
    email?: string
  }
  patientInfo: {
    medications?: Array<{
      name: string
      dosage?: string
      frequency?: string
    }>
    conditions?: string[]
    treatmentPlan?: string
    notes?: string
  }
}

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

    // Check if user is a doctor
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can generate requests' },
        { status: 403 }
      )
    }

    const body: GenerateRequestBody = await request.json()
    const { pharmacyName, doctorInfo, patientInfo } = body

    // Prepare patient information summary
    const medicationsList = patientInfo.medications?.map(m => 
      `${m.name}${m.dosage ? ` (${m.dosage})` : ''}${m.frequency ? ` - ${m.frequency}` : ''}`
    ).join('\n') || 'なし'

    const conditionsList = patientInfo.conditions?.join('、') || 'なし'

    // Generate AI document using OpenAI
    const systemPrompt = `あなたは医師から薬局への患者受け入れ依頼文を作成する専門家です。
以下の情報を基に、薬局が患者の受け入れ可否を判断しやすい、簡潔で専門的な依頼文を日本語で作成してください。

依頼文には以下を含めてください：
1. 依頼医師・医療機関の情報
2. 患者の薬物療法の概要
3. 現在の病状と管理上の注意点
4. 薬局に期待する対応
5. 特別な配慮が必要な事項

文章は敬語を使い、プロフェッショナルな内容にしてください。`

    const doctorInfoText = doctorInfo ? `
依頼医師: ${doctorInfo.name || 'Dr.'}
医療機関: ${doctorInfo.organization || '記載なし'}
連絡先: ${doctorInfo.email || '記載なし'}` : ''

    const userPrompt = `薬局名: ${pharmacyName}${doctorInfoText}

服用中の薬:
${medicationsList}

既往・現疾患: ${conditionsList}

今後の治療方針: ${patientInfo.treatmentPlan || '記載なし'}

備考: ${patientInfo.notes || 'なし'}`

    // OpenAI APIが利用できない場合はテンプレートを返す
    if (!openai) {
      const templateDocument = `${pharmacyName} 御中

${doctorInfoText ? doctorInfoText + '\n\n' : ''}この度、以下の患者様の在宅医療における薬剤管理について、貴薬局のご協力を賜りたく、ご連絡差し上げました。

【患者情報】
■ 服用中の薬剤:
${medicationsList}

■ 既往・現疾患: ${conditionsList}

■ 今後の治療方針:
${patientInfo.treatmentPlan || '記載なし'}

■ 備考:
${patientInfo.notes || 'なし'}

患者様の継続的な薬物療法のため、貴薬局での対応をお願い申し上げます。
ご不明な点がございましたら、お気軽にお問い合わせください。

何卒よろしくお願い申し上げます。`

      return NextResponse.json({
        success: true,
        aiDocument: templateDocument
      })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiDocument = completion.choices[0].message.content

    return NextResponse.json({
      success: true,
      aiDocument
    })

  } catch (error) {
    console.error('Error generating AI request:', error)
    return NextResponse.json(
      { error: 'Failed to generate request document' },
      { status: 500 }
    )
  }
}