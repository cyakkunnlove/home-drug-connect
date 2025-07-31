import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend } from '@/lib/email/client'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // パスワードリセットメールを送信
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) {
      console.error('パスワードリセットエラー:', error)
      return NextResponse.json(
        { error: 'パスワードリセットメールの送信に失敗しました' },
        { status: 500 }
      )
    }

    // Resendでもメールを送信（バックアップ）
    const resend = getResend()
    if (resend) {
      try {
        await resend.emails.send({
        from: '在宅薬局ナビ <noreply@zaitaku-yakkyoku-navi.com>',
        to: email,
        subject: 'パスワードリセットのお知らせ',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>パスワードリセット</h2>
            <p>パスワードリセットのリクエストを受け付けました。</p>
            <p>メールボックスに届いたSupabaseからのメールをご確認ください。</p>
            <p>リクエストに心当たりがない場合は、このメールを無視してください。</p>
            <hr />
            <p style="color: #666; font-size: 14px;">在宅薬局ナビ</p>
          </div>
        `,
        })
      } catch (resendError) {
        console.error('Resendメール送信エラー:', resendError)
        // Resendのエラーは無視（Supabaseのメールが送信されていれば問題ない）
      }
    }

    return NextResponse.json({
      message: 'パスワードリセットメールを送信しました',
    })
  } catch (error) {
    console.error('サーバーエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}