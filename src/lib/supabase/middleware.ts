import { NextResponse, type NextRequest } from 'next/server'

// Decodifica o payload de um JWT sem verificar a assinatura.
// Suficiente para decisões de roteamento — a validação real ocorre nos layouts via getUser().
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64)) as Record<string, unknown>
  } catch {
    return null
  }
}

// Lê a sessão Supabase diretamente dos cookies sem nenhuma chamada de rede.
// Suporta cookie simples (sb-<ref>-auth-token) e cookies fragmentados (.0, .1, ...).
function readSessionFromCookies(request: NextRequest): { id: string; app_metadata: Record<string, unknown> } | null {
  const map = Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))

  let raw: string | null =
    Object.entries(map).find(([k]) => /^sb-.+-auth-token$/.test(k))?.[1] ?? null

  if (!raw) {
    const base = Object.keys(map).find(k => /^sb-.+-auth-token\.0$/.test(k))?.replace('.0', '')
    if (base) {
      const chunks: string[] = []
      let i = 0
      while (map[`${base}.${i}`]) chunks.push(map[`${base}.${i++}`])
      raw = chunks.join('') || null
    }
  }

  if (!raw) return null

  try {
    const json = raw.startsWith('base64-') ? atob(raw.slice(7)) : raw
    const session = JSON.parse(json) as { access_token?: string }
    if (!session?.access_token) return null

    const payload = decodeJwtPayload(session.access_token)
    if (!payload) return null

    // Token expirado: retorna null — o browser e os layouts cuidam do refresh
    if (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) return null

    return {
      id: payload.sub as string,
      app_metadata: (payload.app_metadata as Record<string, unknown>) ?? {},
    }
  } catch {
    return null
  }
}

export function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })
  const user = readSessionFromCookies(request)
  return { supabaseResponse, user }
}
