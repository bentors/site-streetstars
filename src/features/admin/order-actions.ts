'use server'

import { adminTransitionSchema, trackingCodeSchema } from '@/lib/admin-orders'
import { fail, ok, type Result } from '@/lib/result'
import { requireAdmin } from '@/server/auth/session'
import { applyAdminTransition, markOrderSeen, updateTracking } from '@/server/db/orders'
import { sendShippedEmail } from '@/server/orders/order-emails'

// Ids automáticos do Firestore e ids escolhidos (coleções migradas usam o slug); sem '/' nem '.'.
const isId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value)
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

export async function updateTrackingAction(
  orderId: string,
  code: unknown,
): Promise<Result<{ emailSent: boolean }>> {
  const admin = await requireAdmin()
  if (!isId(orderId)) return BAD_ID
  const parsed = trackingCodeSchema.safeParse(code)
  if (!parsed.success) {
    return fail('invalid_input', parsed.error.issues[0]?.message ?? 'Código inválido.')
  }
  const updated = await updateTracking(orderId, parsed.data, admin.uid, new Date())
  if (!updated.ok) return updated
  return ok({ emailSent: await trySendShipped(orderId) })
}
