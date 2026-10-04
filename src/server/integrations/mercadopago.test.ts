import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import {
  buildPreferenceBody,
  createPreference,
  getPayment,
  type PreferenceOrder,
} from './mercadopago'

const order: PreferenceOrder = {
  id: 'o1',
  number: 'SS-1001',
  customer: {
    uid: null,
    email: 'ana@exemplo.com',
    name: 'Ana Maria Souza',
    phone: '11987654321',
    cpf: '52998224725',
  },
  items: [
    {
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: '',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty: 2,
      lineTotalCents: 29980,
    },
    {
      productId: 'p2',
      slug: 'bone',
      name: 'Boné',
      image: '',
      size: 'UN',
      color: null,
      unitPriceCents: 12990,
      qty: 1,
      lineTotalCents: 12990,
    },
  ],
  totals: { subtotalCents: 42970, discountCents: 0, shippingCents: 2500, totalCents: 45470 },
  expiresAt: new Date('2026-10-06T12:00:00.000Z'),
}
const urls = {
  orderUrl: 'https://loja.test/pedido/o1.mac',
  notificationUrl: 'https://loja.test/api/webhooks/mercadopago?source_news=webhooks',
}

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  env.value = { MERCADOPAGO_ACCESS_TOKEN: 'TEST-123' }
})
afterEach(() => vi.unstubAllGlobals())

describe('buildPreferenceBody', () => {
  it('sem desconto: itens detalhados + frete como item, Pix e cartão em até 6x', () => {
    const body = buildPreferenceBody(order, urls)
    expect(body).toMatchObject({
      items: [
        {
          id: 'p1',
          title: 'Camiseta · M · Preto',
          quantity: 2,
          unit_price: 149.9,
          currency_id: 'BRL',
        },
        { id: 'p2', title: 'Boné · UN', quantity: 1, unit_price: 129.9, currency_id: 'BRL' },
        { id: 'frete', title: 'Frete', quantity: 1, unit_price: 25, currency_id: 'BRL' },
      ],
      payer: {
        name: 'Ana',
        surname: 'Maria Souza',
        email: 'ana@exemplo.com',
        identification: { type: 'CPF', number: '52998224725' },
      },
      back_urls: { success: urls.orderUrl, failure: urls.orderUrl, pending: urls.orderUrl },
      auto_return: 'approved',
      external_reference: 'o1',
      notification_url: urls.notificationUrl,
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
        installments: 6,
      },
      expires: true,
      expiration_date_to: '2026-10-06T12:00:00.000Z',
    })
    // Frete como item: a soma dos itens é o total do pedido, que o webhook confere.
    expect(body).not.toHaveProperty('shipments')
  })

  it('com desconto: um item só com o total (frete incluso), nunca valor zero', () => {
    const body = buildPreferenceBody(
      {
        ...order,
        totals: {
          subtotalCents: 42970,
          discountCents: 42970,
          shippingCents: 2500,
          totalCents: 2500,
        },
      },
      urls,
    )
    expect(body.items).toEqual([
      { id: 'SS-1001', title: 'Pedido SS-1001', quantity: 1, unit_price: 25, currency_id: 'BRL' },
    ])
    expect(body).not.toHaveProperty('shipments')
  })

  it('sem https (desenvolvimento) não pede retorno automático', () => {
    const body = buildPreferenceBody(order, { ...urls, orderUrl: 'http://localhost:3000/pedido/x' })
    expect(body).not.toHaveProperty('auto_return')
  })
})

describe('createPreference', () => {
  it('cria a preferência com o token e devolve o link', async () => {
    fetchMock.mockResolvedValue(json({ id: 'pref-1', init_point: 'https://mp.test/init?pref=1' }))
    expect(await createPreference({ a: 1 })).toEqual({
      preferenceId: 'pref-1',
      initPoint: 'https://mp.test/init?pref=1',
    })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.mercadopago.com/checkout/preferences')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer TEST-123' })
    expect(JSON.parse(init.body)).toEqual({ a: 1 })
  })

  it('falha sem token ou com erro HTTP', async () => {
    env.value = {}
    await expect(createPreference({})).rejects.toThrow('MERCADOPAGO_ACCESS_TOKEN')
    env.value = { MERCADOPAGO_ACCESS_TOKEN: 'TEST-123' }
    fetchMock.mockResolvedValue(json({ message: 'bad' }, 400))
    await expect(createPreference({})).rejects.toThrow('400')
  })
})

describe('getPayment', () => {
  it('traduz o pagamento para centavos e datas', async () => {
    fetchMock.mockResolvedValue(
      json({
        id: 9001,
        status: 'approved',
        external_reference: 'o1',
        transaction_amount: 324.8,
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        date_approved: '2026-10-04T13:00:00.000-03:00',
      }),
    )
    expect(await getPayment('9001')).toEqual({
      id: '9001',
      status: 'approved',
      externalReference: 'o1',
      amountCents: 32480,
      method: 'pix',
      approvedAt: new Date('2026-10-04T16:00:00.000Z'),
    })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.mercadopago.com/v1/payments/9001')
  })

  it('recusa id que não é numérico sem chamar a API', async () => {
    await expect(getPayment('../x')).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
