import { beforeEach, describe, expect, it, vi } from 'vitest'

const quoteShipping = vi.hoisted(() => vi.fn())
const createPreference = vi.hoisted(() => vi.fn())
vi.mock('@/server/integrations/melhorenvio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/integrations/melhorenvio')>()),
  quoteShipping,
}))
vi.mock('@/server/integrations/mercadopago', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/integrations/mercadopago')>()),
  createPreference,
}))

import { createOrder } from '@/server/checkout/create-order'
import { db } from '@/server/db/firebase-admin'
import { getOrder, ordersCollection } from '@/server/db/orders'
import { NOW, productDoc } from './fixtures'
import { clearFirestore } from './helpers'

const DAY = 24 * 60 * 60 * 1000
const KEY = '2f1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b'
const QUOTES = [
  { serviceId: 1, name: 'PAC', company: 'Correios', priceCents: 2500, deliveryDays: 8 },
  { serviceId: 2, name: 'SEDEX', company: 'Correios', priceCents: 4000, deliveryDays: 3 },
]

function input(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: KEY,
    lines: [{ productId: 'p1', size: 'M', color: 'Preto', qty: 2 }],
    customer: {
      email: 'Ana@Exemplo.com',
      name: 'Ana Souza',
      phone: '(11) 98765-4321',
      cpf: '529.982.247-25',
    },
    address: {
      cep: '20040-002',
      street: 'Rua da Assembleia',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    serviceId: 1,
    couponCode: null,
    ...overrides,
  }
}

const ctx = { uid: null, now: NOW }

async function allOrders() {
  return (await ordersCollection().get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

beforeEach(async () => {
  await clearFirestore()
  vi.resetAllMocks()
  quoteShipping.mockResolvedValue(QUOTES)
  let n = 0
  createPreference.mockImplementation(async () => {
    n += 1
    return { preferenceId: `pref-${n}`, initPoint: `https://mp.test/init/${n}` }
  })
  await db().doc('products/p1').set(productDoc())
  await db().doc('settings/store').set({ originCep: '01001000' })
})

describe('createOrder', () => {
  it('cria o pedido com preços do catálogo e frete cotado no servidor', async () => {
    const result = await createOrder(input({ shippingPriceCents: 1, totals: { totalCents: 1 } }), {
      uid: 'u1',
      now: NOW,
    })
    expect(result).toEqual({ ok: true, data: { redirectUrl: 'https://mp.test/init/1' } })

    const [order] = await allOrders()
    expect(order).toMatchObject({
      number: 'SS-1001',
      idempotencyKey: KEY,
      status: 'pending_payment',
      customer: {
        uid: 'u1',
        email: 'ana@exemplo.com',
        name: 'Ana Souza',
        phone: '11987654321',
        cpf: '52998224725',
      },
      items: [{ productId: 'p1', unitPriceCents: 14990, qty: 2, lineTotalCents: 29980 }],
      shippingAddress: { cep: '20040002', state: 'RJ' },
      shipping: {
        serviceId: 1,
        name: 'PAC',
        priceCents: 2500,
        deliveryDays: 8,
        productionDays: 10,
      },
      coupon: null,
      totals: { subtotalCents: 29980, discountCents: 0, shippingCents: 2500, totalCents: 32480 },
      statusHistory: [{ status: 'pending_payment', at: NOW, by: 'system' }],
      payment: { preferenceId: 'pref-1', paymentId: null },
      expiresAt: new Date(NOW.getTime() + 2 * DAY),
    })

    expect(quoteShipping).toHaveBeenCalledWith({
      fromCep: '01001000',
      toCep: '20040002',
      weightGrams: 500,
      package: { heightCm: 5, widthCm: 30, lengthCm: 30 },
    })
    const body = createPreference.mock.calls[0]?.[0]
    expect(body.external_reference).toBe(order?.id)
    expect(body.back_urls.success).toMatch(
      new RegExp(`^http://localhost:3000/pedido/${order?.id}\\.`),
    )
    expect(body.notification_url).toBe(
      'http://localhost:3000/api/webhooks/mercadopago?source_news=webhooks',
    )
  })

  it('numera pedidos diferentes em sequência', async () => {
    await createOrder(input(), ctx)
    await createOrder(input({ idempotencyKey: '3f1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b' }), ctx)
    expect((await allOrders()).map((order) => order.number).sort()).toEqual(['SS-1001', 'SS-1002'])
  })

  it('mesma chave devolve o mesmo pedido com um link de pagamento novo', async () => {
    const first = await createOrder(input(), ctx)
    const second = await createOrder(input({ serviceId: 2 }), ctx)
    expect(first).toEqual({ ok: true, data: { redirectUrl: 'https://mp.test/init/1' } })
    expect(second).toEqual({ ok: true, data: { redirectUrl: 'https://mp.test/init/2' } })
    const orders = await allOrders()
    expect(orders).toHaveLength(1)
    expect(orders[0]?.shipping.serviceId).toBe(1)
  })

  it('mesma chave de pedido já pago leva para a página do pedido', async () => {
    await createOrder(input(), ctx)
    const [order] = await allOrders()
    await db().doc(`orders/${order?.id}`).update({ status: 'paid' })
    const again = await createOrder(input(), ctx)
    expect(again.ok && again.data.redirectUrl).toMatch(/^http:\/\/localhost:3000\/pedido\//)
    expect(createPreference).toHaveBeenCalledTimes(1)
  })

  it('Mercado Pago fora do ar: erro, pedido pendente e nova tentativa reaproveita', async () => {
    createPreference.mockRejectedValueOnce(new Error('MP 503'))
    expect(await createOrder(input(), ctx)).toMatchObject({
      ok: false,
      code: 'payment_unavailable',
    })
    const retry = await createOrder(input(), ctx)
    expect(retry.ok).toBe(true)
    const orders = await allOrders()
    expect(orders).toHaveLength(1)
    expect(orders[0]?.status).toBe('pending_payment')
  })

  it('recusa produto que deixou de estar à venda', async () => {
    await db().doc('products/p1').update({ status: 'draft' })
    expect(await createOrder(input(), ctx)).toMatchObject({ ok: false, code: 'cart_changed' })
    expect(await allOrders()).toEqual([])
  })

  it('recusa tamanho que não existe', async () => {
    const result = await createOrder(
      input({ lines: [{ productId: 'p1', size: 'XG', color: 'Preto', qty: 1 }] }),
      ctx,
    )
    expect(result).toMatchObject({ ok: false, code: 'cart_changed' })
  })

  it('recusa frete que o Melhor Envio não ofereceu', async () => {
    expect(await createOrder(input({ serviceId: 99 }), ctx)).toMatchObject({
      ok: false,
      code: 'shipping_changed',
    })
  })

  it('frete indisponível (sem CEP de origem ou erro no Melhor Envio)', async () => {
    quoteShipping.mockRejectedValueOnce(new Error('timeout'))
    expect(await createOrder(input(), ctx)).toMatchObject({
      ok: false,
      code: 'shipping_unavailable',
    })
    await db().doc('settings/store').set({ originCep: '' })
    expect(await createOrder(input(), ctx)).toMatchObject({
      ok: false,
      code: 'shipping_unavailable',
    })
  })

  it('aplica cupom válido e recusa expirado ou esgotado', async () => {
    const coupon = {
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: null,
      maxUses: null,
      usedCount: 0,
      active: true,
    }
    await db().doc('coupons/BEMVINDO').set(coupon)
    await db()
      .doc('coupons/VELHO')
      .set({ ...coupon, endsAt: new Date(NOW.getTime() - DAY) })
    await db()
      .doc('coupons/ESGOTADO')
      .set({ ...coupon, maxUses: 5, usedCount: 5 })

    expect(await createOrder(input({ couponCode: 'velho' }), ctx)).toMatchObject({
      ok: false,
      code: 'coupon_expired',
    })
    expect(await createOrder(input({ couponCode: 'ESGOTADO' }), ctx)).toMatchObject({
      ok: false,
      code: 'coupon_exhausted',
    })

    expect((await createOrder(input({ couponCode: 'bemvindo' }), ctx)).ok).toBe(true)
    const [order] = await allOrders()
    expect(order?.coupon).toEqual({
      code: 'BEMVINDO',
      type: 'percent',
      value: 10,
      discountCents: 2998,
    })
    expect(order?.totals).toEqual({
      subtotalCents: 29980,
      discountCents: 2998,
      shippingCents: 2500,
      totalCents: 29482,
    })
    expect(createPreference.mock.calls[0]?.[0].items).toEqual([
      {
        id: 'SS-1001',
        title: 'Pedido SS-1001',
        quantity: 1,
        unit_price: 294.82,
        currency_id: 'BRL',
      },
    ])
  })

  it('reserva o uso do cupom ao criar e recusa o pedido seguinte quando esgota', async () => {
    await db().doc('coupons/UNICO').set({
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: null,
      maxUses: 1,
      usedCount: 0,
      active: true,
    })
    const first = await createOrder(input({ couponCode: 'UNICO' }), ctx)
    expect(first.ok).toBe(true)
    expect((await db().doc('coupons/UNICO').get()).get('usedCount')).toBe(1)

    const second = await createOrder(
      input({ couponCode: 'UNICO', idempotencyKey: '3a1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b' }),
      ctx,
    )
    expect(second).toMatchObject({ ok: false, code: 'coupon_exhausted' })
    expect(await allOrders()).toHaveLength(1)
  })

  it('dois pedidos simultâneos com o último uso: só um passa', async () => {
    await db().doc('coupons/UNICO').set({
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: null,
      maxUses: 1,
      usedCount: 0,
      active: true,
    })
    const results = await Promise.all([
      createOrder(input({ couponCode: 'UNICO' }), ctx),
      createOrder(
        input({ couponCode: 'UNICO', idempotencyKey: '4b1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b' }),
        ctx,
      ),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect((await db().doc('coupons/UNICO').get()).get('usedCount')).toBe(1)
  })

  it('recusa entrada inválida sem tocar no banco', async () => {
    const result = await createOrder(input({ customer: { email: 'x' } }), ctx)
    expect(result).toMatchObject({ ok: false, code: 'invalid_input' })
    expect(quoteShipping).not.toHaveBeenCalled()
  })

  it('o pedido gravado passa pelo schema (getOrder lê sem erro)', async () => {
    await createOrder(input(), ctx)
    const [order] = await allOrders()
    expect(await getOrder(order?.id ?? '')).not.toBeNull()
  })
})
