import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openaiApiKey = process.env.OPENAI_API_KEY
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, field } = await request.json()
    
    if (!text || text.trim().length < 10) {
      return NextResponse.json({ 
        success: true, 
        refinedText: text,
        message: 'Text too short for refinement' 
      })
    }

    // If OpenAI is not available, return original text
    if (!openai) {
      return NextResponse.json({ 
        success: true, 
        refinedText: text,
        usingOriginal: true 
      })
    }

    const systemPrompt = field === 'treatmentPlan' 
      ? `あなたは医療文書の校正専門家です。医師が記載した今後の治療方針を、より明確で専門的な文章に改善してください。
原文の意味を保ちながら、以下の点を改善してください：
1. 文法的な誤りの修正
2. 医療用語の適切な使用
3. 曖昧な表現の明確化
4. 読みやすさの向上
5. 専門性の維持

原文が既に適切な場合は、そのまま返してください。`
      : `あなたは医療文書の校正専門家です。文章をより明確で読みやすく改善してください。`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `以下の文章を校正してください：\n\n${text}` }
        ],
        temperature: 0.3,
        max_tokens: 300
      })

      const refinedText = completion.choices[0].message.content || text
      
      return NextResponse.json({
        success: true,
        refinedText,
        original: text
      })
    } catch (error) {
      console.error('OpenAI error:', error)
      return NextResponse.json({ 
        success: true, 
        refinedText: text,
        error: 'AI refinement failed, using original text' 
      })
    }

  } catch (error) {
    console.error('Error refining text:', error)
    return NextResponse.json(
      { error: 'Failed to refine text' },
      { status: 500 }
    )
  }
}