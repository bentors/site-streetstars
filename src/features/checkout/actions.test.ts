import { beforeEach, describe, expect, it, vi } from 'vitest'

const rateLimit = vi.hoisted(() => vi.fn())
const createOrder = vi.hoisted(() => vi.fn())
const getSessionUser = vi.hoisted(() => vi.fn())
vi.mock('@/server/ratelimit', () => ({ rateLimit, clientIp: async () => '1.2.3.4' }))
vi.mock('@/server/checkout/create-order', () => ({ createOrder }))
vi.mock('@/server/auth/session', () => ({ getSessionUser }))

import { createOrderAction, lookupCepAction } from './actions'

beforeEach(() => {
  vi.resetAllMocks()
  rateLimit.mockResolvedValue(true)
  createOrder.mockResolvedValue({ ok: true, data: { redirectUrl: 'https://mp.test' } })
})

describe('createOrderAction', () => {
  it('limita por IP antes de qualquer trabalho', async () => {
    rateLimit.mockResolvedValueOnce(false)
    expect(await createOrderAction({})).toMatchObject({ ok: false, code: 'rate_limited' })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('limita também por e-mail (normalizado)', async () => {
    rateLimit.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const result = await createOrderAction({ customer: { email: ' Ana@Exemplo.com ' } })
    expect(result).toMatchObject({ ok: false, code: 'rate_limited' })
    expect(rateLimit.mock.calls[1]?.[0]).toBe('order-email:ana@exemplo.com')
  })

  it('passa o uid da sessão para o pedido', async () => {
    getSessionUser.mockResolvedValue({ uid: 'u1' })
    await createOrderAction({ customer: { email: 'a@b.com' } })
    expect(createOrder).toHaveBeenCalledWith(
      { customer: { email: 'a@b.com' } },
      { uid: 'u1', now: expect.any(Date) },
    )
  })
})

describe('lookupCepAction', () => {
  it('recusa CEP malformado sem chamar o ViaCEP', async () => {
    expect(await lookupCepAction('123')).toMatchObject({ ok: false, code: 'invalid_cep' })
  })
})
