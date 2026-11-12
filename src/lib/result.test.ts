import { describe, expect, it } from 'vitest'
import { fail, ok } from './result'

describe('Result', () => {
  it('ok carrega os dados', () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } })
  })
  it('fail carrega código e mensagem', () => {
    expect(fail('not_found', 'Não encontrado.')).toEqual({
      ok: false,
      code: 'not_found',
      message: 'Não encontrado.',
    })
  })
})
