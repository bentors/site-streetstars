'use server'

import { redirect } from 'next/navigation'
import { addressInputSchema, profileSchema } from '@/lib/account'
import { fail, ok, type Result } from '@/lib/result'
import { destroySession, getAuthAccount, requireUser } from '@/server/auth/session'
import {
  addUserAddress,
  removeUserAddress,
  saveProfile,
  setDefaultUserAddress,
  updateUserAddress,
} from '@/server/db/users'

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

const done = (result: Result<unknown>): Result<null> => (result.ok ? ok(null) : result)

const invalid = (error: { issues: { message: string }[] }) =>
  fail('invalid_input', error.issues[0]?.message ?? 'Confira os dados.')

export async function updateProfileAction(input: unknown): Promise<Result<null>> {
  const user = await requireUser('/conta/perfil')
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const saved = await saveProfile(user.uid, parsed.data, new Date())
  return done(saved)
}

const BAD_ID = fail('invalid_input', 'Requisição inválida.')
const isId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64

export async function saveAddressAction(id: string | null, input: unknown): Promise<Result<null>> {
  const user = await requireUser('/conta/enderecos')
  if (id !== null && !isId(id)) return BAD_ID
  const parsed = addressInputSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const now = new Date()
  return done(
    id === null
      ? await addUserAddress(user.uid, parsed.data, now)
      : await updateUserAddress(user.uid, id, parsed.data, now),
  )
}

export async function deleteAddressAction(id: unknown): Promise<Result<null>> {
  const user = await requireUser('/conta/enderecos')
  if (!isId(id)) return BAD_ID
  return done(await removeUserAddress(user.uid, id, new Date()))
}

export async function setDefaultAddressAction(id: unknown): Promise<Result<null>> {
  const user = await requireUser('/conta/enderecos')
  if (!isId(id)) return BAD_ID
  return done(await setDefaultUserAddress(user.uid, id, new Date()))
}
