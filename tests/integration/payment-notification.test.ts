import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPayment = vi.hoisted(() => vi.fn())
const sendEmail = vi.hoisted(() => vi.fn())
vi.mock('@/server/integrations/mercadopago', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/integrations/mercadopago')>()),
  getPayment,
}))
vi.mock('@/server/integrations/resend', () => ({ sendEmail }))

import { db } from '@/server/db/firebase-admin'
import { getOrder, ordersCollection } from '@/server/db/orders'
import { handlePaymentNotification } from '@/server/orders/payment-notification'
import { orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

const STORE_EMAIL = 'streetstars.company@gmail.com'

const payment = (overrides: Record<string, unknown> = {}) => ({
  id: '9001',
  status: 'approved',
  externalReference: 'o1',
  amountCents: 32480,
  method: 'pix',
  approvedAt: new Date('2026-10-04T13:00:00.000Z'),
  ...overrides,
})

async function couponUses() {
  return (await db().doc('coupons/BEMVINDO').get()).get('usedCount')
}

beforeEach(async () => {
  await clearFirestore()
  vi.resetAllMocks()
  sendEmail.mockResolvedValue(undefined)
  await ordersCollection()
    .doc('o1')
    .set(orderDoc({ coupon: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 0 } }))
  await db().doc('coupons/BEMVINDO').set({ usedCount: 0 })
})

describe('handlePaymentNotification', () => {
  it('aprovado com o valor certo: pago e e-mails enviados uma vez; o cupom já foi reservado na criação', async () => {
    getPayment.mockResolvedValue(payment())
    expect(await handlePaymentNotification('9001')).toBe('processed')

    const order = await getOrder('o1')
    expect(order).toMatchObject({
      status: 'paid',
      payment: {
        paymentId: '9001',
        status: 'approved',
        method: 'pix',
        paidAmountCents: 32480,
        paidAt: new Date('2026-10-04T13:00:00.000Z'),
      },
    })
    expect(order?.statusHistory.at(-1)).toMatchObject({
      status: 'paid',
      by: 'webhook',
      paymentId: '9001',
    })
    expect(order?.notifications.confirmationSentAt).toBeInstanceOf(Date)
    expect(order?.notifications.adminAlertSentAt).toBeInstanceOf(Date)
    expect(await couponUses()).toBe(0)
    expect(sendEmail.mock.calls.map(([message]) => message.to)).toEqual([
      'ana@exemplo.com',
      STORE_EMAIL,
    ])
    expect(sendEmail.mock.calls[0]?.[0].html).toContain('/pedido/o1.')

    // Mesmo evento de novo (o MP reenvia): nada muda.
    expect(await handlePaymentNotification('9001')).toBe('ignored')
    expect(await couponUses()).toBe(0)
    expect(sendEmail).toHaveBeenCalledTimes(2)
  })

  it('entregas simultâneas: pago uma vez e cada e-mail com a mesma chave de idempotência', async () => {
    getPayment.mockResolvedValue(payment())
    await Promise.all([handlePaymentNotification('9001'), handlePaymentNotification('9001')])
    expect(await couponUses()).toBe(0)
    const keys = sendEmail.mock.calls.map(([message]) => message.idempotencyKey)
    expect(keys.length).toBeGreaterThanOrEqual(2)
    expect(new Set(keys)).toEqual(new Set(['order-confirmation/o1', 'admin-new-order/o1']))
    // Transações disputando o mesmo pedido: o SDK repete com backoff.
  }, 30_000)

  it('valor divergente: continua pendente, registra e alerta a loja uma vez', async () => {
    getPayment.mockResolvedValue(payment({ amountCents: 100 }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    const order = await getOrder('o1')
    expect(order?.status).toBe('pending_payment')
    expect(order?.statusHistory.at(-1)?.note).toMatch(/não foi marcado como pago/)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0]?.[0]).toMatchObject({
      to: STORE_EMAIL,
      subject: 'Alerta no pedido SS-1001',
    })

    await handlePaymentNotification('9001')
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(await couponUses()).toBe(0)
  })

  it('recusado depois de aprovado não regride', async () => {
    getPayment.mockResolvedValueOnce(payment())
    await handlePaymentNotification('9001')
    getPayment.mockResolvedValueOnce(payment({ id: '9002', status: 'rejected' }))
    expect(await handlePaymentNotification('9002')).toBe('ignored')
    expect((await getOrder('o1'))?.status).toBe('paid')
  })

  it('recusado com pedido pendente só registra o status do pagamento', async () => {
    getPayment.mockResolvedValue(payment({ status: 'rejected' }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    expect(await getOrder('o1')).toMatchObject({
      status: 'pending_payment',
      payment: { paymentId: '9001', status: 'rejected' },
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('pedido expirado ainda vira pago e volta a contar o cupom', async () => {
    await db().doc('orders/o1').update({ status: 'expired' })
    getPayment.mockResolvedValue(payment())
    await handlePaymentNotification('9001')
    expect((await getOrder('o1'))?.status).toBe('paid')
    expect(await couponUses()).toBe(1)
  })

  it('pago depois de expirar com o cupom esgotado: paga, registra e alerta a loja', async () => {
    await db().doc('orders/o1').update({ status: 'expired' })
    await db().doc('coupons/BEMVINDO').set({ usedCount: 1, maxUses: 1 })
    getPayment.mockResolvedValue(payment())
    await handlePaymentNotification('9001')
    const order = await getOrder('o1')
    expect(order?.status).toBe('paid')
    expect(order?.statusHistory.some((e) => e.note?.includes('passou do limite'))).toBe(true)
    expect(
      sendEmail.mock.calls.some(
        ([m]) => m.to === STORE_EMAIL && String(m.html).includes('passou do limite'),
      ),
    ).toBe(true)
  })

  it('estorno do pagamento do pedido → estornado', async () => {
    getPayment.mockResolvedValueOnce(payment())
    await handlePaymentNotification('9001')
    getPayment.mockResolvedValueOnce(payment({ status: 'refunded' }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    expect((await getOrder('o1'))?.status).toBe('refunded')
  })

  it('pagamento que o MP não encontra é ignorado (sem 500 em loop)', async () => {
    getPayment.mockResolvedValue(null)
    expect(await handlePaymentNotification('123')).toBe('ignored')
  })

  it('estorno de pedido que o admin cancelou depois de pago → estornado', async () => {
    getPayment.mockResolvedValueOnce(payment())
    await handlePaymentNotification('9001')
    await db().doc('orders/o1').update({ status: 'cancelled' })
    getPayment.mockResolvedValueOnce(payment({ status: 'refunded' }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    expect(await getOrder('o1')).toMatchObject({
      status: 'refunded',
      payment: { status: 'refunded' },
    })
  })

  it('pagamento sem pedido, de pedido inexistente ou id inválido é ignorado', async () => {
    getPayment.mockResolvedValueOnce(payment({ externalReference: null }))
    expect(await handlePaymentNotification('9001')).toBe('ignored')
    getPayment.mockResolvedValueOnce(payment({ externalReference: 'nao-existe' }))
    expect(await handlePaymentNotification('9001')).toBe('ignored')
    expect(await handlePaymentNotification('abc')).toBe('ignored')
    expect(getPayment).toHaveBeenCalledTimes(2)
  })

  it('falha no e-mail propaga (500) e a próxima entrega envia o que faltou', async () => {
    getPayment.mockResolvedValue(payment())
    sendEmail.mockRejectedValueOnce(new Error('resend fora'))
    await expect(handlePaymentNotification('9001')).rejects.toThrow('resend fora')
    let order = await getOrder('o1')
    expect(order?.status).toBe('paid')
    expect(order?.notifications.confirmationSentAt).toBeNull()

    await handlePaymentNotification('9001')
    order = await getOrder('o1')
    expect(order?.notifications.confirmationSentAt).toBeInstanceOf(Date)
    expect(order?.notifications.adminAlertSentAt).toBeInstanceOf(Date)
    expect(sendEmail).toHaveBeenCalledTimes(3)
    expect(await couponUses()).toBe(0)
  })
})
