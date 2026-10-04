import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const handlePaymentNotification = vi.hoisted(() => vi.fn())
vi.mock('@/server/orders/payment-notification', () => ({ handlePaymentNotification }))
vi.mock('@/server/env', () => ({ serverEnv: () => ({ MERCADOPAGO_WEBHOOK_SECRET: 'segredo' }) }))

import { POST } from './route'

function request({
  dataId = '9001',
  type = 'payment',
  secret = 'segredo',
}: { dataId?: string; type?: string; secret?: string } = {}) {
  const ts = '1700000000'
  const v1 = createHmac('sha256', secret)
    .update(`id:${dataId};request-id:req-1;ts:${ts};`)
    .digest('hex')
  return new Request(`https://loja.test/api/webhooks/mercadopago?data.id=${dataId}&type=${type}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-signature': `ts=${ts},v1=${v1}`,
      'x-request-id': 'req-1',
    },
    body: JSON.stringify({ type, data: { id: dataId } }),
  })
}

beforeEach(() => {
  handlePaymentNotification.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/webhooks/mercadopago', () => {
  it('assinatura inválida → 401 sem processar', async () => {
    const response = await POST(request({ secret: 'outro' }))
    expect(response.status).toBe(401)
    expect(handlePaymentNotification).not.toHaveBeenCalled()
  })

  it('evento que não é de pagamento → 200 sem processar', async () => {
    const response = await POST(request({ type: 'merchant_order' }))
    expect(response.status).toBe(200)
    expect(handlePaymentNotification).not.toHaveBeenCalled()
  })

  it('pagamento → processa pelo id e responde 200', async () => {
    handlePaymentNotification.mockResolvedValue('processed')
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(handlePaymentNotification).toHaveBeenCalledWith('9001')
  })

  it('erro temporário → 500 para o Mercado Pago reenviar', async () => {
    handlePaymentNotification.mockRejectedValue(new Error('firestore fora'))
    expect((await POST(request())).status).toBe(500)
  })
})
