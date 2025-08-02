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
    medicationStock?: string
    nextVisitDate?: string
    notes?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log request start
    console.log('[AI Generate Request] Starting request processing')
    
    const supabase = await createClient()
    
    // Check authentication with detailed logging
    console.log('[AI Generate Request] Checking authentication')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('[AI Generate Request] Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }
    if (!user) {
      console.error('[AI Generate Request] No user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }
    console.log('[AI Generate Request] User authenticated:', user.id)

    // Check if user is a doctor with detailed logging
    console.log('[AI Generate Request] Checking user role')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('[AI Generate Request] User query error:', userError)
      return NextResponse.json(
        { error: 'Failed to verify user role', details: userError.message },
        { status: 500 }
      )
    }
    
    console.log('[AI Generate Request] User role:', userData?.role)
    if (userData?.role !== 'doctor') {
      console.error('[AI Generate Request] Invalid role:', userData?.role)
      return NextResponse.json(
        { error: 'Only doctors can generate requests', currentRole: userData?.role },
        { status: 403 }
      )
    }

    // Parse request body with error handling
    console.log('[AI Generate Request] Parsing request body')
    let body: GenerateRequestBody
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[AI Generate Request] JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { pharmacyName, doctorInfo, patientInfo } = body
    console.log('[AI Generate Request] Request data:', { 
      pharmacyName, 
      doctorInfo: doctorInfo ? 'present' : 'missing',
      medicationsCount: patientInfo?.medications?.length || 0,
      conditionsCount: patientInfo?.conditions?.length || 0
    })

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
4. 薬の残量と次回往診予定日（提供された場合）
5. 薬局に期待する対応（特に緊急性がある場合は強調）
6. 特別な配慮が必要な事項

文章は敬語を使い、プロフェッショナルな内容にしてください。
薬の残量が少ない場合や、次回往診まで期間が短い場合は、その緊急性を適切に伝えてください。`

    const doctorInfoText = doctorInfo ? `
依頼医師: ${doctorInfo.name || 'Dr.'}
医療機関: ${doctorInfo.organization || '記載なし'}
連絡先: ${doctorInfo.email || '記載なし'}` : ''

    const userPrompt = `薬局名: ${pharmacyName}${doctorInfoText}

服用中の薬:
${medicationsList}

既往・現疾患: ${conditionsList}

今後の治療方針: ${patientInfo.treatmentPlan || '記載なし'}

薬の残量: ${patientInfo.medicationStock || '記載なし'}

次回往診予定日: ${patientInfo.nextVisitDate ? new Date(patientInfo.nextVisitDate).toLocaleDateString('ja-JP') : '記載なし'}

備考: ${patientInfo.notes || 'なし'}`

    // OpenAI APIが利用できない場合はテンプレートを返す
    if (!openai) {
      console.warn('[AI Generate Request] OpenAI API not available, using template')
      const templateDocument = `${pharmacyName} 御中

${doctorInfoText ? doctorInfoText + '\n\n' : ''}この度、以下の患者様の在宅医療における薬剤管理について、貴薬局のご協力を賜りたく、ご連絡差し上げました。

【患者情報】
■ 服用中の薬剤:
${medicationsList}

■ 既往・現疾患: ${conditionsList}

■ 今後の治療方針:
${patientInfo.treatmentPlan || '記載なし'}

■ 薬の残量: ${patientInfo.medicationStock || '記載なし'}

■ 次回往診予定日: ${patientInfo.nextVisitDate ? new Date(patientInfo.nextVisitDate).toLocaleDateString('ja-JP') : '記載なし'}

■ 備考:
${patientInfo.notes || 'なし'}

患者様の継続的な薬物療法のため、貴薬局での対応をお願い申し上げます。
ご不明な点がございましたら、お気軽にお問い合わせください。

何卒よろしくお願い申し上げます。`

      console.log('[AI Generate Request] Template document generated successfully')
      return NextResponse.json({
        success: true,
        aiDocument: templateDocument,
        usingTemplate: true
      })
    }

    console.log('[AI Generate Request] Calling OpenAI API')
    try {
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
      
      if (!aiDocument) {
        console.error('[AI Generate Request] OpenAI returned empty content')
        throw new Error('OpenAI returned empty response')
      }

      console.log('[AI Generate Request] OpenAI response received successfully')
      return NextResponse.json({
        success: true,
        aiDocument,
        usingTemplate: false
      })
    } catch (openaiError: any) {
      console.error('[AI Generate Request] OpenAI API error:', {
        error: openaiError,
        message: openaiError?.message,
        status: openaiError?.status,
        statusText: openaiError?.statusText,
        code: openaiError?.code,
        type: openaiError?.type,
        response: openaiError?.response?.data
      })
      
      // エラーの詳細情報を含めてレスポンスを返す
      const errorDetails = {
        message: openaiError?.message || 'Unknown OpenAI error',
        code: openaiError?.code,
        type: openaiError?.type,
        status: openaiError?.status
      }
      
      console.warn('[AI Generate Request] Falling back to template due to OpenAI error')
      
      // Fall back to template if OpenAI fails
      const templateDocument = `${pharmacyName} 御中

${doctorInfoText ? doctorInfoText + '\n\n' : ''}この度、以下の患者様の在宅医療における薬剤管理について、貴薬局のご協力を賜りたく、ご連絡差し上げました。

【患者情報】
■ 服用中の薬剤:
${medicationsList}

■ 既往・現疾患: ${conditionsList}

■ 今後の治療方針:
${patientInfo.treatmentPlan || '記載なし'}

■ 薬の残量: ${patientInfo.medicationStock || '記載なし'}

■ 次回往診予定日: ${patientInfo.nextVisitDate ? new Date(patientInfo.nextVisitDate).toLocaleDateString('ja-JP') : '記載なし'}

■ 備考:
${patientInfo.notes || 'なし'}

患者様の継続的な薬物療法のため、貴薬局での対応をお願い申し上げます。
ご不明な点がございましたら、お気軽にお問い合わせください。

何卒よろしくお願い申し上げます。`

      console.log('[AI Generate Request] Using template fallback due to OpenAI error')
      return NextResponse.json({
        success: true,
        aiDocument: templateDocument,
        usingTemplate: true,
        fallbackReason: 'OpenAI API error'
      })
    }

  } catch (error) {
    console.error('[AI Generate Request] Unexpected error:', error)
    
    // Provide detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('[AI Generate Request] Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate request document',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}