import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // CSPヘッダーを設定（開発環境では緩い設定）
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!isDevelopment) {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:;
      style-src 'self' 'unsafe-inline' https: http:;
      font-src 'self' https: http: data:;
      img-src 'self' data: https: http: blob:;
      connect-src 'self' https: http: wss: ws:;
      frame-src 'self' https: http:;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https: http:;
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim()

    response.headers.set('Content-Security-Policy', cspHeader)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 保護されたルートのチェック
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/pharmacy/login', request.url))
  }

  // 認証済みユーザーが認証ページにアクセスしようとした場合
  if (
    (request.nextUrl.pathname === '/pharmacy/login' || 
     request.nextUrl.pathname === '/pharmacy/register') && 
    user
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}