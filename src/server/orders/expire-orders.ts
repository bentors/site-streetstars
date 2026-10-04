import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
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
      tx.update(db().doc(`orders/${doc.id}`), {
        status: 'expired',
        statusHistory: FieldValue.arrayUnion({ status: 'expired', at: now, by: 'system' }),
        updatedAt: now,
      })
      return true
    })
    if (changed) expired += 1
  }
  return expired
}
