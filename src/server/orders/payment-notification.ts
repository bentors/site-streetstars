import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { formatBRL } from '@/lib/money'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/order-status'
import { couponUsageWrite, readCouponUsage } from '@/server/db/coupons'
import { db } from '@/server/db/firebase-admin'
import { ordersCollection, type OrderDoc } from '@/server/db/orders'
import { decidePaymentOutcome, type PaymentOutcome } from '@/server/domain/payment-outcome'
import { getPayment, type MpPayment } from '@/server/integrations/mercadopago'
import { sendAdminAlert, sendPaidOrderEmails } from './order-emails'

const ORDER_ID = /^[A-Za-z0-9]{1,64}$/

type AlertReason = Extract<PaymentOutcome, { kind: 'alert' }>['reason']

function alertNote(reason: AlertReason, payment: MpPayment, order: OrderDoc): string {
  return reason === 'amount_mismatch'
    ? `Pagamento ${payment.id} aprovado com ${formatBRL(payment.amountCents)}, mas o pedido custa ${formatBRL(order.totals.totalCents)}. O pedido não foi marcado como pago.`
    : `Pagamento ${payment.id} aprovado para um pedido com status "${ORDER_STATUS_LABELS[order.status]}". Confira no Mercado Pago se é cobrança em dobro ou se precisa estornar.`
}

function paymentUpdates(
  order: OrderDoc,
  payment: MpPayment,
  outcome: PaymentOutcome,
  now: Date,
): Record<string, unknown> | null {
  const paymentFields = {
    'payment.paymentId': payment.id,
    'payment.status': payment.status,
    'payment.method': payment.method,
  }
  const history = (status: OrderStatus, note?: string) =>
    FieldValue.arrayUnion({
      status,
      at: now,
      by: 'webhook',
      paymentId: payment.id,
      ...(note ? { note } : {}),
    })

  switch (outcome.kind) {
    case 'ignore':
      return null
    case 'record':
      return { ...paymentFields, updatedAt: now }
    case 'transition':
      return outcome.to === 'paid'
        ? {
            ...paymentFields,
            'payment.paidAmountCents': payment.amountCents,
            'payment.paidAt': payment.approvedAt ?? now,
            status: 'paid',
            statusHistory: history('paid'),
            updatedAt: now,
          }
        : {
            'payment.status': payment.status,
            status: 'refunded',
            statusHistory: history('refunded'),
            updatedAt: now,
          }
    case 'alert': {
      // Pedido já pago guarda os dados do pagamento certo (o estorno depende deles).
      const waiting = order.status === 'pending_payment' || order.status === 'expired'
      return {
        ...(waiting ? paymentFields : {}),
        statusHistory: history(order.status, alertNote(outcome.reason, payment, order)),
        updatedAt: now,
      }
    }
  }
}

export async function handlePaymentNotification(
  paymentId: string,
  now = new Date(),
): Promise<'processed' | 'ignored'> {
  if (!/^\d{1,20}$/.test(paymentId)) return 'ignored'
  // A API do MP é a fonte da verdade; erro aqui vira 500 e o MP reenvia.
  const payment = await getPayment(paymentId)
  const orderId = payment.externalReference
  if (!orderId || !ORDER_ID.test(orderId)) {
    console.warn('webhook MP: pagamento sem pedido', { paymentId })
    return 'ignored'
  }

  const result = await db().runTransaction(async (tx) => {
    const order = (await tx.get(ordersCollection().doc(orderId))).data()
    if (!order) return null
    const outcome = decidePaymentOutcome(
      {
        status: order.status,
        totalCents: order.totals.totalCents,
        payment: order.payment,
        handledPaymentIds: order.statusHistory.flatMap((entry) =>
          entry.paymentId ? [entry.paymentId] : [],
        ),
      },
      payment,
    )
    // pending_payment já reservou o uso ao criar; expired devolveu, então pagar depois reserva de novo.
    const reReserve =
      outcome.kind === 'transition' &&
      outcome.to === 'paid' &&
      order.status === 'expired' &&
      order.coupon !== null
    const usage = reReserve && order.coupon ? await readCouponUsage(tx, order.coupon.code) : null
    const couponOverLimit = !!usage && usage.maxUses !== null && usage.usedCount >= usage.maxUses

    const updates = paymentUpdates(order, payment, outcome, now)
    if (updates) tx.update(db().doc(`orders/${orderId}`), updates)
    if (usage) {
      tx.update(usage.ref, couponUsageWrite(usage, 1))
      if (couponOverLimit) {
        tx.update(db().doc(`orders/${orderId}`), {
          statusHistory: FieldValue.arrayUnion({
            status: 'paid',
            at: now,
            by: 'webhook',
            note: `Cupom ${order.coupon?.code} passou do limite de usos (pedido pago depois de expirar).`,
          }),
        })
      }
    }
    return { order, outcome, couponOverLimit }
  })

  if (!result) {
    console.warn('webhook MP: pedido não encontrado', { orderId, paymentId })
    return 'ignored'
  }
  const { order, outcome, couponOverLimit } = result
  console.info('webhook MP', { orderId, paymentId, paymentStatus: payment.status, outcome })

  if (outcome.kind === 'alert') {
    await sendAdminAlert(order.number, alertNote(outcome.reason, payment, order))
  }
  if (couponOverLimit) {
    await sendAdminAlert(
      order.number,
      `O cupom ${order.coupon?.code} passou do limite de usos: o pedido foi pago depois de expirar.`,
    )
  }
  await sendPaidOrderEmails(orderId, now)
  return outcome.kind === 'ignore' ? 'ignored' : 'processed'
}
