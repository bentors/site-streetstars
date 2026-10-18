'use server'

import { redirect } from 'next/navigation'
import { fail, type Result } from '@/lib/result'
import { destroySession, getAuthAccount, requireUser } from '@/server/auth/session'

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
