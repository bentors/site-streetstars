import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/server/db/firebase-admin'
import {
  applyAdminTransition,
  getOrder,
  listAdminOrders,
  listUnseenPaidOrders,
  markOrderSeen,
  updateTracking,
} from '@/server/db/orders'
import { NOW, orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

const LATER = new Date(NOW.getTime() + 60_000)
const customer = orderDoc().customer

async function seed(id: string, overrides: Parameters<typeof orderDoc>[0] = {}) {
  await db().doc(`orders/${id}`).set(orderDoc(overrides))
}

describe('listAdminOrders', () => {
  beforeEach(async () => {
    await seed('a', { number: 'SS-1001', status: 'paid', createdAt: new Date('2026-10-01') })
    await seed('b', {
      number: 'SS-1002',
      status: 'shipped',
      createdAt: new Date('2026-10-02'),
      customer: { ...customer, email: 'bia@exemplo.com' },
    })
  })

  it('sem filtro lista do mais novo para o mais antigo', async () => {
    const ids = (await listAdminOrders({ status: null, search: '' })).map((o) => o.id)
    expect(ids).toEqual(['b', 'a'])
  })

  it('filtra por status', async () => {
    const ids = (await listAdminOrders({ status: 'paid', search: '' })).map((o) => o.id)
    expect(ids).toEqual(['a'])
  })

  it('busca por número com ou sem prefixo e por e-mail', async () => {
    expect((await listAdminOrders({ status: null, search: '1002' })).map((o) => o.id)).toEqual([
      'b',
    ])
    expect((await listAdminOrders({ status: null, search: 'ss-1001' })).map((o) => o.id)).toEqual([
      'a',
    ])
    expect(
      (await listAdminOrders({ status: null, search: ' BIA@exemplo.com ' })).map((o) => o.id),
    ).toEqual(['b'])
  })

  it('texto que não é número nem e-mail não encontra nada', async () => {
    expect(await listAdminOrders({ status: null, search: 'camiseta' })).toEqual([])
  })
})

describe('pagos não vistos', () => {
  it('somem depois de abertos', async () => {
    await seed('a', { status: 'paid' })
    await seed('b', { status: 'pending_payment' })
    expect((await listUnseenPaidOrders()).map((o) => o.id)).toEqual(['a'])
    await markOrderSeen('a', LATER)
    expect(await listUnseenPaidOrders()).toEqual([])
    expect((await getOrder('a'))?.adminSeenAt).toEqual(LATER)
  })

  it('pedido gravado antes do campo existir conta como não visto', async () => {
    const legacy: Record<string, unknown> = { ...orderDoc({ status: 'paid' }) }
    delete legacy.adminSeenAt
    await db().doc('orders/old').set(legacy)
    expect((await listUnseenPaidOrders()).map((o) => o.id)).toEqual(['old'])
  })
})

describe('applyAdminTransition', () => {
  it('enviado grava rastreio, histórico com o uid do admin e status', async () => {
    await seed('a', { status: 'in_production' })
    const result = await applyAdminTransition(
      'a',
      { to: 'shipped', trackingCode: 'AB123456789BR' },
      'admin-uid',
      LATER,
    )
    expect(result.ok).toBe(true)
    const order = await getOrder('a')
    expect(order).toMatchObject({
      status: 'shipped',
      tracking: {
        carrier: 'Correios',
        code: 'AB123456789BR',
        url: 'https://melhorrastreio.com.br/rastreio/AB123456789BR',
      },
      updatedAt: LATER,
    })
    expect(order?.statusHistory.at(-1)).toEqual({ status: 'shipped', at: LATER, by: 'admin-uid' })
  })

  it('cancelamento guarda a observação', async () => {
    await seed('a', { status: 'paid' })
    await applyAdminTransition('a', { to: 'cancelled', note: 'Cliente desistiu' }, 'adm', LATER)
    expect((await getOrder('a'))?.statusHistory.at(-1)).toMatchObject({
      status: 'cancelled',
      note: 'Cliente desistiu',
    })
  })

  it('transição fora da tabela é recusada e nada muda', async () => {
    await seed('a', { status: 'shipped' })
    const result = await applyAdminTransition('a', { to: 'in_production' }, 'adm', LATER)
    expect(result).toMatchObject({ ok: false, code: 'invalid_transition' })
    expect(result.ok ? '' : result.message).toContain('Enviado')
    expect((await getOrder('a'))?.status).toBe('shipped')
  })

  it('cancelar pedido ainda pendente devolve a reserva do cupom', async () => {
    const coupon = { code: 'BEMVINDO', type: 'percent' as const, value: 10, discountCents: 0 }
    await db().doc('coupons/BEMVINDO').set({ usedCount: 1 })
    await seed('a', { status: 'pending_payment', coupon })
    await applyAdminTransition('a', { to: 'cancelled', note: 'Teste' }, 'adm', LATER)
    expect((await db().doc('coupons/BEMVINDO').get()).get('usedCount')).toBe(0)
  })

  it('cancelar pedido pago mantém o uso', async () => {
    const coupon = { code: 'BEMVINDO', type: 'percent' as const, value: 10, discountCents: 0 }
    await db().doc('coupons/BEMVINDO').set({ usedCount: 1 })
    await seed('a', { status: 'paid', coupon })
    await applyAdminTransition('a', { to: 'cancelled', note: 'Teste' }, 'adm', LATER)
    expect((await db().doc('coupons/BEMVINDO').get()).get('usedCount')).toBe(1)
  })

  it('pedido inexistente dá not_found', async () => {
    expect(await applyAdminTransition('zzz', { to: 'delivered' }, 'adm', LATER)).toMatchObject({
      code: 'not_found',
    })
  })
})

describe('updateTracking', () => {
  const tracking = { carrier: 'Correios', code: 'AA000000000BR', url: 'https://x' }

  it('troca o código, libera um novo e-mail e registra', async () => {
    await seed('a', {
      status: 'shipped',
      tracking,
      notifications: { confirmationSentAt: NOW, shippedSentAt: NOW, adminAlertSentAt: NOW },
    })
    expect(await updateTracking('a', 'BB111111111BR', 'adm', LATER)).toEqual({
      ok: true,
      data: null,
    })
    const order = await getOrder('a')
    expect(order?.tracking?.code).toBe('BB111111111BR')
    expect(order?.notifications.shippedSentAt).toBeNull()
    expect(order?.statusHistory.at(-1)).toMatchObject({
      status: 'shipped',
      by: 'adm',
      note: 'Rastreio corrigido para BB111111111BR',
    })
  })

  it('pedido que não foi enviado não aceita', async () => {
    await seed('a', { status: 'paid' })
    expect(await updateTracking('a', 'BB111111111BR', 'adm', LATER)).toMatchObject({
      code: 'invalid_transition',
    })
  })
})
