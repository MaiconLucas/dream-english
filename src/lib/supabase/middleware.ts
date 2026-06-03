import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      // autoRefreshToken: false evita chamadas de rede no Edge Runtime (causa MIDDLEWARE_INVOCATION_TIMEOUT no Vercel).
      // O refresh real do token acontece no layout via createClient() no servidor.
      auth: { autoRefreshToken: false, detectSessionInUrl: false },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  return { supabaseResponse, user: session?.user ?? null }
}
