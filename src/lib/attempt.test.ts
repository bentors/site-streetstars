import { describe, expect, it } from 'vitest'
import { attempt } from './attempt'

describe('attempt', () => {
  it('devolve o resultado normal', async () => {
    expect(await attempt(async () => ({ ok: true as const, data: 1 }))).toEqual({
      ok: true,
      data: 1,
    })
  })

  it('erro de rede vira falha com mensagem', async () => {
    expect(
      await attempt(async () => {
        throw new TypeError('Failed to fetch')
      }),
    ).toEqual({
      ok: false,
      code: 'network',
      message: 'Sem conexão ou erro inesperado. Tente de novo.',
    })
  })
})
