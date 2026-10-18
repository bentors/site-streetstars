'use server'

import { redirect } from 'next/navigation'
import { signUpSchema } from '@/lib/account'
import { fail, ok, type Result } from '@/lib/result'
import { createSession, destroySession } from '@/server/auth/session'
import { saveProfile } from '@/server/db/users'
import { clientIp, rateLimit } from '@/server/ratelimit'

const INVALID = fail('invalid_input', 'Requisição inválida.')
const LIMITED = fail('rate_limited', 'Muitas tentativas. Aguarde um minuto.')

function isIdToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 4096
}

export async function signInAction(idToken: string): Promise<Result<null>> {
  if (!isIdToken(idToken)) return INVALID
  const ip = await clientIp()
  if (!(await rateLimit(`signin:${ip}`, { limit: 10, windowSec: 60 }))) return LIMITED
  const session = await createSession(idToken)
  return session.ok ? ok(null) : session
}

export async function signUpAction(idToken: string, input: unknown): Promise<Result<null>> {
  if (!isIdToken(idToken)) return INVALID
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return fail('invalid_input', parsed.error.issues[0]?.message ?? 'Confira os dados.')
  }
  const ip = await clientIp()
  if (!(await rateLimit(`signup:${ip}`, { limit: 5, windowSec: 600 }))) return LIMITED

  const session = await createSession(idToken)
  if (!session.ok) return session
  try {
    const { name, marketingConsent } = parsed.data
    await saveProfile(
      session.data.uid,
      { name, phone: null, cpf: null, marketingConsent },
      new Date(),
    )
  } catch (error) {
    // A conta e a sessão já existem; o nome pode ser corrigido no perfil.
    console.error('signUp: falha ao gravar o perfil', { uid: session.data.uid, error })
  }
  return ok(null)
}

export async function signOutAction(): Promise<void> {
  await destroySession()
  redirect('/')
}
