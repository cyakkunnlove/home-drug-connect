import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, category, message } = body

    const supabase = await createClient()

    // お問い合わせを保存
    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone,
        category,
        message,
        status: 'new'
      })

    if (error) {
      console.error('Contact submission error:', error)
      return NextResponse.json(
        { error: 'お問い合わせの送信に失敗しました' },
        { status: 500 }
      )
    }

    // TODO: 管理者にメール通知を送信

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}