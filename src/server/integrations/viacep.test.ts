import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lookupCep } from './viacep'

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('lookupCep', () => {
  it('traduz a resposta do ViaCEP', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          cep: '01001-000',
          logradouro: 'Praça da Sé',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        }),
      ),
    )
    expect(await lookupCep('01001000')).toEqual({
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://viacep.com.br/ws/01001000/json/')
  })

  it('CEP inexistente → null', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ erro: 'true' })))
    expect(await lookupCep('99999999')).toBeNull()
  })

  it('erro do serviço lança', async () => {
    fetchMock.mockResolvedValue(new Response('fora', { status: 503 }))
    await expect(lookupCep('01001000')).rejects.toThrow('503')
  })
})
