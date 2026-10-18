'use server'

import { redirect } from 'next/navigation'
import { profileSchema } from '@/lib/account'
import { fail, ok, type Result } from '@/lib/result'
import { destroySession, getAuthAccount, requireUser } from '@/server/auth/session'
import { saveProfile } from '@/server/db/users'

/**
 * O cookie guarda `email_verified` do momento do login. Depois de confirmar o e-mail,
 * um login novo atualiza o cookie e vincula os pedidos feitos sem conta.
 */
export async function confirmEmailAction(): Promise<Result<null>> {
  const user = await requireUser()
  const account = await getAuthAccount(user.uid)
  if (!account.emailVerified) {
    return fail(
      'not_verified',
      'Ainda não recebemos a confirmação. Abra o link do e-mail e tente de novo.',
    )
  }
  await destroySession()
  redirect('/entrar?next=/conta&confirmado=1')
}

const invalid = (error: { issues: { message: string }[] }) =>
  fail('invalid_input', error.issues[0]?.message ?? 'Confira os dados.')

export async function updateProfileAction(input: unknown): Promise<Result<null>> {
  const user = await requireUser('/conta/perfil')
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const saved = await saveProfile(user.uid, parsed.data, new Date())
  return saved.ok ? ok(null) : saved
}
