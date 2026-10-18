import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { couponUsageWrite, readCouponUsage } from '@/server/db/coupons'
import { db } from '@/server/db/firebase-admin'
import { ordersCollection } from '@/server/db/orders'
import { canTransition } from '@/server/domain/order-status'

// ponytail: até 200 por execução diária; se a fila crescer, paginar até esvaziar.
const BATCH = 200

export async function expirePendingOrders(now = new Date()): Promise<number> {
  const due = await ordersCollection()
    .where('status', '==', 'pending_payment')
    .where('expiresAt', '<=', now)
    .limit(BATCH)
    .get()

  let expired = 0
  for (const doc of due.docs) {
    // Relê na transação: o webhook pode ter pago o pedido entre a consulta e a escrita.
    const changed = await db().runTransaction(async (tx) => {
      const order = (await tx.get(doc.ref)).data()
      if (order?.status !== 'pending_payment' || !canTransition(order.status, 'expired')) {
        return false
      }
      // Pedido que não foi pago devolve o uso do cupom reservado na criação.
      const usage = order.coupon ? await readCouponUsage(tx, order.coupon.code) : null
      tx.update(db().doc(`orders/${doc.id}`), {
        status: 'expired',
        statusHistory: FieldValue.arrayUnion({ status: 'expired', at: now, by: 'system' }),
        updatedAt: now,
      })
      if (usage) tx.update(usage.ref, couponUsageWrite(usage, -1))
      return true
    })
    if (changed) expired += 1
  }
  return expired
}
