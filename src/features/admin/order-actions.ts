'use server'

import { adminTransitionSchema } from '@/lib/admin-orders'
import { fail, ok, type Result } from '@/lib/result'
import { requireAdmin } from '@/server/auth/session'
import { applyAdminTransition, markOrderSeen } from '@/server/db/orders'
import { sendShippedEmail } from '@/server/orders/order-emails'

const isId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9]{1,64}$/.test(value)
const BAD_ID = fail('invalid_input', 'Pedido inválido.')

async function trySendShipped(orderId: string): Promise<boolean> {
  try {
    await sendShippedEmail(orderId)
    return true
  } catch (error) {
    console.error('admin: e-mail de envio não saiu', { orderId, error })
    return false
  }
}

export async function transitionOrderAction(
  orderId: string,
  input: unknown,
): Promise<Result<{ emailSent: boolean }>> {
  const admin = await requireAdmin()
  if (!isId(orderId)) return BAD_ID
  const parsed = adminTransitionSchema.safeParse(input)
  if (!parsed.success) {
    return fail('invalid_input', parsed.error.issues[0]?.message ?? 'Confira os dados.')
  }
  const applied = await applyAdminTransition(orderId, parsed.data, admin.uid, new Date())
  if (!applied.ok) return applied
  // O status já mudou; e-mail que falha fica para o botão "Reenviar".
  const emailSent = parsed.data.to === 'shipped' ? await trySendShipped(orderId) : true
  return ok({ emailSent })
}

export async function resendShippedEmailAction(orderId: string): Promise<Result<null>> {
  await requireAdmin()
  if (!isId(orderId)) return BAD_ID
  try {
    return (await sendShippedEmail(orderId))
      ? ok(null)
      : fail('nothing_to_send', 'Este pedido não tem e-mail de envio pendente.')
  } catch (error) {
    console.error('admin: reenvio do e-mail de envio falhou', { orderId, error })
    return fail('email_failed', 'O e-mail não saiu. Tente de novo em instantes.')
  }
}

export async function markOrderSeenAction(orderId: string): Promise<void> {
  await requireAdmin()
  if (isId(orderId)) await markOrderSeen(orderId, new Date())
}
