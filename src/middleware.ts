import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/api/auth/callback']
const RESET_PASSWORD_ROUTE = '/reset-password'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isResetPassword = pathname.startsWith(RESET_PASSWORD_ROUTE)
  const isAdminRoute = pathname.startsWith('/admin')

  // Lê sessão do cookie (sem DB call — usa getSession internamente)
  const { supabaseResponse, user } = await updateSession(request)

  // Não autenticado: redireciona para login
  if (!user && !isPublic && !isResetPassword) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Autenticado em rota pública: redireciona para destino correto por role
  // Só redireciona se o role estiver explicitamente no JWT (app_metadata sincronizado).
  // Se não estiver, deixa o login form ou o layout lidar com o destino.
  const hasError = request.nextUrl.searchParams.has('error')
  if (user && isPublic && pathname !== '/api/auth/callback' && !hasError) {
    const role = (user.app_metadata as Record<string, unknown>)?.role as string | undefined
    if (role) {
      const dest = role === 'STUDENT' ? '/trail' : '/admin/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // Rotas /admin/*: verifica role do JWT app_metadata (sem DB call)
  // O app_metadata é embutido no JWT pelo Supabase — o AdminLayout sincroniza na primeira visita.
  if (user && isAdminRoute) {
    const role = (user.app_metadata as Record<string, unknown>)?.role as string | undefined
    console.log(`[Middleware] /admin — user: ${user.id} | app_metadata.role: ${role ?? 'não sincronizado ainda'}`)

    // Bloqueia apenas se o role estiver explicitamente definido como não-ADMIN.
    // Se ainda não foi sincronizado (primeira visita), o AdminLayout fará a verificação.
    if (role && role !== 'ADMIN') {
      console.log('[Middleware] Bloqueado: role não é ADMIN')
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
