import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendEmail = vi.hoisted(() => vi.fn())
vi.mock('@/server/integrations/resend', () => ({ sendEmail }))

import { db } from '@/server/db/firebase-admin'
import { getOrder } from '@/server/db/orders'
import { sendShippedEmail } from '@/server/orders/order-emails'
import { NOW, orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

const tracking = { carrier: 'Correios', code: 'AB123456789BR', url: 'https://x.test/AB' }

beforeEach(async () => {
  await clearFirestore()
  vi.resetAllMocks()
  sendEmail.mockResolvedValue(undefined)
})

describe('sendShippedEmail', () => {
  it('envia uma vez só, com chave de idempotência, e marca a data', async () => {
    await db()
      .doc('orders/a')
      .set(orderDoc({ status: 'shipped', tracking }))
    expect(await sendShippedEmail('a', NOW)).toBe(true)
    expect(await sendShippedEmail('a', NOW)).toBe(false)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0]?.[0]).toMatchObject({
      to: 'ana@exemplo.com',
      idempotencyKey: 'order-shipped/a/AB123456789BR',
      subject: 'Pedido SS-1001 enviado',
    })
    expect((await getOrder('a'))?.notifications.shippedSentAt).toEqual(NOW)
  })

  it('não envia para pedido que não está enviado ou sem rastreio', async () => {
    await db()
      .doc('orders/a')
      .set(orderDoc({ status: 'in_production', tracking }))
    await db()
      .doc('orders/b')
      .set(orderDoc({ status: 'shipped', tracking: null }))
    expect(await sendShippedEmail('a', NOW)).toBe(false)
    expect(await sendShippedEmail('b', NOW)).toBe(false)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('pedido já entregue sem o e-mail de envio ainda recebe o rastreio', async () => {
    await db()
      .doc('orders/a')
      .set(orderDoc({ status: 'delivered', tracking }))
    expect(await sendShippedEmail('a', NOW)).toBe(true)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('falha no Resend lança e não marca como enviado', async () => {
    await db()
      .doc('orders/a')
      .set(orderDoc({ status: 'shipped', tracking }))
    sendEmail.mockRejectedValue(new Error('Resend respondeu 500'))
    await expect(sendShippedEmail('a', NOW)).rejects.toThrow('500')
    expect((await getOrder('a'))?.notifications.shippedSentAt).toBeNull()
  })
})
