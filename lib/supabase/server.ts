import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Connection reuse for better performance
let globalServerClient: ReturnType<typeof createServerClient> | null = null

export async function createClient() {
  const cookieStore = await cookies()

  // In production, reuse client when possible for connection pooling
  if (process.env.NODE_ENV === 'production' && globalServerClient) {
    return globalServerClient
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set(name, '', options)
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Disable for server-side performance
      },
      global: {
        headers: {
          'x-client-info': 'home-drug-connect-server/1.0.0',
        },
      },
    }
  )

  // Cache client in production
  if (process.env.NODE_ENV === 'production') {
    globalServerClient = client
  }

  return client
}

// Optimized client for read-only operations
export async function createReadOnlyClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-client-info': 'home-drug-connect-readonly/1.0.0',
        },
      },
    }
  )
}