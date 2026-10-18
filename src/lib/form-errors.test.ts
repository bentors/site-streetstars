import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { fieldErrors } from './form-errors'

describe('fieldErrors', () => {
  it('pega a primeira mensagem de cada campo', () => {
    const schema = z.object({
      name: z.string().min(1, 'Obrigatório').min(3, 'Curto'),
      cpf: z.string().length(11, 'CPF inválido'),
    })
    const result = schema.safeParse({ name: '', cpf: '1' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(fieldErrors(result.error)).toEqual({ name: 'Obrigatório', cpf: 'CPF inválido' })
  })

  it('ignora erros sem campo (raiz)', () => {
    const result = z.string().safeParse(1)
    if (result.success) throw new Error('esperava falha')
    expect(fieldErrors(result.error)).toEqual({})
  })
})
