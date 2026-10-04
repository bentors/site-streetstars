import 'server-only'
import { publicEnv } from '@/lib/env'
import { db } from '@/server/db/firebase-admin'
import type { Order } from '@/server/db/orders'
import { buildPreferenceBody, createPreference } from '@/server/integrations/mercadopago'
import { isPayable, orderUrl } from './access'

/** Pedido pagável → nova preferência no MP (link de pagamento); senão → página do pedido. */
export async function paymentRedirectUrl(order: Order, now = new Date()): Promise<string> {
  const url = orderUrl(order.id)
  if (!isPayable(order, now)) return url

  const notificationUrl = new URL(
    '/api/webhooks/mercadopago?source_news=webhooks',
    publicEnv().NEXT_PUBLIC_SITE_URL,
  ).toString()
  const preference = await createPreference(
    buildPreferenceBody(order, { orderUrl: url, notificationUrl }),
  )
  await db()
    .doc(`orders/${order.id}`)
    .update({ 'payment.preferenceId': preference.preferenceId, updatedAt: now })
  return preference.initPoint
}
