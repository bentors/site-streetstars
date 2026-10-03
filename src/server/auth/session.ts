import 'server-only'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { fail, ok, type Result } from '@/lib/result'
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from '@/lib/session-cookie'
import { adminAuth } from '@/server/db/firebase-admin'
import { ensureUser } from '@/server/db/users'

export type SessionUser = {
  uid: string
  email: string | null
  emailVerified: boolean
  isAdmin: boolean
}

const RECENT_LOGIN_SEC = 5 * 60

export async function createSession(idToken: string): Promise<Result<{ uid: string }>> {
  let decoded
  try {
    decoded = await adminAuth().verifyIdToken(idToken)
  } catch {
    return fail('invalid_token', 'Não foi possível entrar. Tente novamente.')
  }

  // O Firebase só permite criar session cookie a partir de um login recente.
  if (Math.floor(Date.now() / 1000) - decoded.auth_time > RECENT_LOGIN_SEC) {
    return fail('recent_login_required', 'Sua sessão expirou. Entre novamente.')
  }
  if (!decoded.email) {
    return fail('email_required', 'Sua conta precisa ter um e-mail.')
  }

  let sessionCookie: string
  try {
    // Perfil primeiro: o cookie só é gravado quando tudo que a sessão precisa já existe.
    const name = typeof decoded.name === 'string' ? decoded.name : null
    await ensureUser({ uid: decoded.uid, email: decoded.email, name })
    sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SEC * 1000,
    })
  } catch (error) {
    console.error('createSession: falha ao criar a sessão', { uid: decoded.uid, error })
    return fail('session_failed', 'Não foi possível entrar. Tente novamente.')
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
  return ok({ uid: decoded.uid })
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value
  if (!value) return null
  try {
    const decoded = await adminAuth().verifySessionCookie(value, true)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: decoded.email_verified === true,
      isAdmin: decoded.admin === true,
    }
  } catch {
    return null
  }
})

export async function requireUser(next = '/conta'): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`)
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser('/admin')
  // 404 em vez de 403: não revela que a área existe.
  if (!user.isAdmin) notFound()
  return user
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  store.delete(SESSION_COOKIE)
  if (!value) return
  try {
    const decoded = await adminAuth().verifySessionCookie(value)
    await adminAuth().revokeRefreshTokens(decoded.sub)
  } catch {
    // Cookie já inválido: nada a revogar.
  }
}
