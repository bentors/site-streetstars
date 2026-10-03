'use server'

import { redirect } from 'next/navigation'
import { fail, ok, type Result } from '@/lib/result'
import { createSession, destroySession } from '@/server/auth/session'
import { clientIp, rateLimit } from '@/server/ratelimit'

export async function signInAction(idToken: string): Promise<Result<null>> {
  if (typeof idToken !== 'string' || idToken.length === 0 || idToken.length > 4096) {
    return fail('invalid_input', 'Requisição inválida.')
  }
  const ip = await clientIp()
  if (!(await rateLimit(`signin:${ip}`, { limit: 10, windowSec: 60 }))) {
    return fail('rate_limited', 'Muitas tentativas. Aguarde um minuto.')
  }
  const session = await createSession(idToken)
  return session.ok ? ok(null) : session
}

export async function signOutAction(): Promise<void> {
  await destroySession()
  redirect('/')
}
