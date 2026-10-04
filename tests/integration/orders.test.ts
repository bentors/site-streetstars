import { beforeEach, describe, expect, it } from 'vitest'
import { getCouponRule } from '@/server/db/coupons'
import { db } from '@/server/db/firebase-admin'
import {
  findOrderByIdempotencyKey,
  getOrder,
  nextOrderNumber,
  ordersCollection,
} from '@/server/db/orders'
import { NOW, orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

describe('orders repository', () => {
  it('numera em sequência a partir de SS-1001', async () => {
    const numbers: string[] = []
    for (let i = 0; i < 3; i++) numbers.push(await db().runTransaction((tx) => nextOrderNumber(tx)))
    expect(numbers).toEqual(['SS-1001', 'SS-1002', 'SS-1003'])
  })

  it('numeração concorrente não repete número', async () => {
    const numbers = await Promise.all(
      Array.from({ length: 5 }, () => db().runTransaction((tx) => nextOrderNumber(tx))),
    )
    expect(new Set(numbers).size).toBe(5)
  })

  it('grava e lê um pedido validado (datas voltam como Date)', async () => {
    await ordersCollection().doc('o1').set(orderDoc())
    expect(await getOrder('o1')).toEqual({ id: 'o1', ...orderDoc() })
    expect(await getOrder('nao-existe')).toBeNull()
  })

  it('acha o pedido pela chave de idempotência', async () => {
    await ordersCollection()
      .doc('o1')
      .set(orderDoc({ idempotencyKey: 'k-1' }))
    expect((await findOrderByIdempotencyKey('k-1'))?.id).toBe('o1')
    expect(await findOrderByIdempotencyKey('k-2')).toBeNull()
  })
})

describe('coupons repository', () => {
  it('lê o cupom pelo código normalizado', async () => {
    await db().doc('coupons/BEMVINDO').set({
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: NOW,
      maxUses: 100,
      usedCount: 2,
      active: true,
    })
    expect(await getCouponRule(' bemvindo ')).toEqual({
      code: 'BEMVINDO',
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: NOW,
      maxUses: 100,
      usedCount: 2,
      active: true,
    })
  })

  it('código inválido, inexistente ou documento quebrado → null', async () => {
    await db().doc('coupons/QUEBRADO').set({ type: 'percent', value: 500 })
    expect(await getCouponRule('a/b')).toBeNull()
    expect(await getCouponRule('NADA')).toBeNull()
    expect(await getCouponRule('QUEBRADO')).toBeNull()
  })
})
