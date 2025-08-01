import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 環境変数の存在確認（値は表示しない）
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    // Service Role Keyの最初の10文字だけ表示（デバッグ用）
    SERVICE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' 
      : 'NOT SET',
    // URLの長さを確認
    URL_LENGTH: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: envCheck,
    message: 'Environment variables check complete'
  })
}