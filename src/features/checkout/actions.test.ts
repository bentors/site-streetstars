import { beforeEach, describe, expect, it, vi } from 'vitest'

const rateLimit = vi.hoisted(() => vi.fn())
const createOrder = vi.hoisted(() => vi.fn())
const getSessionUser = vi.hoisted(() => vi.fn())
vi.mock('@/server/ratelimit', () => ({ rateLimit, clientIp: async () => '1.2.3.4' }))
vi.mock('@/server/checkout/create-order', () => ({ createOrder }))
vi.mock('@/server/auth/session', () => ({ getSessionUser }))
const rememberCheckoutDetails = vi.hoisted(() => vi.fn())
vi.mock('@/server/db/users', () => ({ rememberCheckoutDetails }))

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

  const valid = {
    customer: { email: 'a@b.com', name: 'Ana', phone: '(11) 98765-4321', cpf: '529.982.247-25' },
    address: {
      cep: '20040-002',
      street: 'Rua da Assembleia',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    saveAddress: true,
  }

  it('logado: guarda telefone, CPF e endereço depois do pedido', async () => {
    getSessionUser.mockResolvedValue({ uid: 'u1' })
    rememberCheckoutDetails.mockResolvedValue({ ok: true, data: {} })
    await createOrderAction(valid)
    expect(rememberCheckoutDetails).toHaveBeenCalledWith(
      'u1',
      {
        phone: '11987654321',
        cpf: '52998224725',
        address: { ...valid.address, cep: '20040002' },
      },
      expect.any(Date),
    )
  })

  it('sem marcar "salvar endereço" guarda só telefone e CPF', async () => {
    getSessionUser.mockResolvedValue({ uid: 'u1' })
    rememberCheckoutDetails.mockResolvedValue({ ok: true, data: {} })
    await createOrderAction({ ...valid, saveAddress: false })
    expect(rememberCheckoutDetails.mock.calls[0]?.[1]).toMatchObject({ address: null })
  })

  it('não guarda nada sem sessão ou com pedido recusado', async () => {
    await createOrderAction(valid)
    getSessionUser.mockResolvedValue({ uid: 'u1' })
    createOrder.mockResolvedValue({ ok: false, code: 'cart_changed', message: 'x' })
    await createOrderAction(valid)
    expect(rememberCheckoutDetails).not.toHaveBeenCalled()
  })

  it('falha ao guardar não derruba o pedido', async () => {
    getSessionUser.mockResolvedValue({ uid: 'u1' })
    rememberCheckoutDetails.mockRejectedValue(new Error('firestore fora'))
    expect(await createOrderAction(valid)).toEqual({
      ok: true,
      data: { redirectUrl: 'https://mp.test' },
    })
  })
})

describe('lookupCepAction', () => {
  it('recusa CEP malformado sem chamar o ViaCEP', async () => {
    expect(await lookupCepAction('123')).toMatchObject({ ok: false, code: 'invalid_cep' })
  })
})
