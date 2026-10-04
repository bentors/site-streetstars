import { beforeEach, describe, expect, it } from 'vitest'
import { getOrder, ordersCollection } from '@/server/db/orders'
import { expirePendingOrders } from '@/server/orders/expire-orders'
import { NOW, orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

const HOUR = 60 * 60 * 1000

beforeEach(clearFirestore)

describe('expirePendingOrders', () => {
  it('expira só os pendentes vencidos e registra no histórico', async () => {
    const past = new Date(NOW.getTime() - HOUR)
    const future = new Date(NOW.getTime() + HOUR)
    await ordersCollection()
      .doc('vencido')
      .set(orderDoc({ expiresAt: past }))
    await ordersCollection()
      .doc('no-prazo')
      .set(orderDoc({ expiresAt: future }))
    await ordersCollection()
      .doc('pago')
      .set(orderDoc({ status: 'paid', expiresAt: past }))

    expect(await expirePendingOrders(NOW)).toBe(1)

    const expired = await getOrder('vencido')
    expect(expired?.status).toBe('expired')
    expect(expired?.statusHistory.at(-1)).toEqual({ status: 'expired', at: NOW, by: 'system' })
    expect((await getOrder('no-prazo'))?.status).toBe('pending_payment')
    expect((await getOrder('pago'))?.status).toBe('paid')

    expect(await expirePendingOrders(NOW)).toBe(0)
  })
})
