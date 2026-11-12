import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import { parseQuotes, quoteShipping } from './melhorenvio'

const fetchMock = vi.fn()
const input = {
  fromCep: '01001000',
  toCep: '20040002',
  weightGrams: 950,
  package: { heightCm: 5, widthCm: 30, lengthCm: 30 },
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  env.value = { MELHORENVIO_TOKEN: 'tok', MELHORENVIO_ENV: 'sandbox' }
})
afterEach(() => vi.unstubAllGlobals())

describe('parseQuotes', () => {
  it('usa preço e prazo da conta, ignora serviços com erro e ordena pelo preço', () => {
    expect(
      parseQuotes([
        {
          id: 2,
          name: 'SEDEX',
          price: '40.10',
          custom_price: '38.50',
          delivery_time: 2,
          custom_delivery_time: 3,
          company: { name: 'Correios' },
        },
        { id: 1, name: 'PAC', price: '25.00', delivery_time: 7, company: { name: 'Correios' } },
        { id: 3, name: 'Mini', error: 'Serviço indisponível para o trecho.' },
      ]),
    ).toEqual([
      { serviceId: 1, name: 'PAC', company: 'Correios', priceCents: 2500, deliveryDays: 7 },
      { serviceId: 2, name: 'SEDEX', company: 'Correios', priceCents: 3850, deliveryDays: 3 },
    ])
  })

  it('recusa resposta fora do formato', () => {
    expect(() => parseQuotes({ message: 'Unauthenticated.' })).toThrow()
  })
})

describe('quoteShipping', () => {
  it('chama o sandbox com peso em kg e só PAC e SEDEX', async () => {
    fetchMock.mockResolvedValue(
      json([
        { id: 1, name: 'PAC', price: '25.00', delivery_time: 7, company: { name: 'Correios' } },
      ]),
    )
    expect(await quoteShipping(input)).toHaveLength(1)
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' })
    expect(JSON.parse(init.body)).toEqual({
      from: { postal_code: '01001000' },
      to: { postal_code: '20040002' },
      package: { height: 5, width: 30, length: 30, weight: 0.95 },
      options: { receipt: false, own_hand: false },
      services: '1,2',
    })
  })

  it('usa a URL de produção quando configurado', async () => {
    env.value = { MELHORENVIO_TOKEN: 'tok', MELHORENVIO_ENV: 'production' }
    fetchMock.mockResolvedValue(json([]))
    await quoteShipping(input)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
    )
  })

  it('falha sem token, com erro HTTP ou de rede', async () => {
    env.value = { MELHORENVIO_ENV: 'sandbox' }
    await expect(quoteShipping(input)).rejects.toThrow('MELHORENVIO_TOKEN')

    env.value = { MELHORENVIO_TOKEN: 'tok', MELHORENVIO_ENV: 'sandbox' }
    fetchMock.mockResolvedValueOnce(json({ message: 'Unauthenticated.' }, 401))
    await expect(quoteShipping(input)).rejects.toThrow('401')

    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(quoteShipping(input)).rejects.toThrow()
  })
})
