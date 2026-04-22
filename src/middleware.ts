import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/api/auth/callback']

const REDIRECT_BY_ROLE: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
}

const ROLE_PREFIXES: Record<string, string[]> = {
  ADMIN: ['/admin'],
  TEACHER: ['/teacher'],
  STUDENT: ['/student'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  const { supabaseResponse, user, role } = await updateSession(request)

  console.log(`[middleware] path=${pathname} user=${user?.email ?? 'none'} role=${role ?? 'none'}`)

  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublic && pathname !== '/api/auth/callback') {
    const dest = (role && REDIRECT_BY_ROLE[role]) ?? '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (user && role) {
    const dest = REDIRECT_BY_ROLE[role] ?? '/login'

    if (pathname === '/') {
      return NextResponse.redirect(new URL(dest, request.url))
    }

    const allowed = (ROLE_PREFIXES[role] ?? []).some(p => pathname.startsWith(p))
    if (!allowed && !isPublic) {
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
