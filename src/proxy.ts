import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session-cookie'

// Barreira barata: só confere se o cookie existe. Quem valida a sessão de verdade
// é requireUser/requireAdmin no servidor, em toda página e Server Action.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/entrar'
  url.search = ''
  url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/conta/:path*', '/admin/:path*'],
}
