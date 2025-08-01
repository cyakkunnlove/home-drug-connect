import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 本番環境でデバッグAPIを無効化
  if (process.env.NODE_ENV === 'production' && request.nextUrl.pathname.startsWith('/api/debug')) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  
  // 本番環境でデバッグページを無効化
  if (process.env.NODE_ENV === 'production' && request.nextUrl.pathname.startsWith('/debug')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/debug/:path*', '/debug/:path*', '/_debug/:path*']
}