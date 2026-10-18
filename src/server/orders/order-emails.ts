import 'server-only'
import { adminAlertEmail } from '@/emails/admin-alert'
import { adminNewOrderEmail } from '@/emails/admin-new-order'
import { orderConfirmationEmail } from '@/emails/order-confirmation'
import { orderShippedEmail } from '@/emails/order-shipped'
import { isPaidStatus } from '@/lib/order-status'
import { db } from '@/server/db/firebase-admin'
import { getOrder } from '@/server/db/orders'
import { getStoreSettings } from '@/server/db/settings'
import { sendEmail } from '@/server/integrations/resend'
import { orderUrl } from './access'

/** Envia o que ainda falta para um pedido pago. Lança se o envio falhar (o MP reenvia). */
export async function sendPaidOrderEmails(orderId: string, now = new Date()): Promise<void> {
  const order = await getOrder(orderId)
  if (!order || !isPaidStatus(order.status)) return
  const { email: storeEmail } = await getStoreSettings()
  const ref = db().doc(`orders/${orderId}`)

  if (!order.notifications.confirmationSentAt) {
    await sendEmail({
      to: order.customer.email,
      replyTo: storeEmail,
      idempotencyKey: `order-confirmation/${orderId}`,
      ...orderConfirmationEmail(order, orderUrl(order.id)),
    })
    await ref.update({ 'notifications.confirmationSentAt': now })
  }
  if (!order.notifications.adminAlertSentAt) {
    await sendEmail({
      to: storeEmail,
      idempotencyKey: `admin-new-order/${orderId}`,
      ...adminNewOrderEmail(order),
    })
    await ref.update({ 'notifications.adminAlertSentAt': now })
  }
}

/** Alerta à loja. Falha só vai para o log: o histórico do pedido já registrou o problema. */
export async function sendAdminAlert(orderNumber: string, message: string): Promise<void> {
  try {
    const { email } = await getStoreSettings()
    await sendEmail({ to: email, ...adminAlertEmail({ orderNumber, message }) })
  } catch (error) {
    console.error('Alerta à loja não enviado', { orderNumber, message, error })
  }
}

/** E-mail com o rastreio. true = enviado agora; false = nada a enviar. Lança se o Resend falhar. */
export async function sendShippedEmail(orderId: string, now = new Date()): Promise<boolean> {
  const order = await getOrder(orderId)
  if (!order || order.status !== 'shipped' || !order.tracking) return false
  if (order.notifications.shippedSentAt) return false
  const { email: storeEmail } = await getStoreSettings()
  await sendEmail({
    to: order.customer.email,
    replyTo: storeEmail,
    idempotencyKey: `order-shipped/${orderId}`,
    ...orderShippedEmail({ ...order, tracking: order.tracking }, orderUrl(order.id)),
  })
  await db().doc(`orders/${orderId}`).update({ 'notifications.shippedSentAt': now })
  return true
}
