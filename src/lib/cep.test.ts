import { describe, expect, it } from 'vitest'
import { fillFromCep, formatCep, isValidCep, normalizeCep } from './cep'

describe('cep', () => {
  it('normaliza', () => {
    expect(normalizeCep('01310-100')).toBe('01310100')
  })
  it('valida 8 dígitos e recusa zeros', () => {
    expect(isValidCep('01310-100')).toBe(true)
    expect(isValidCep('0131010')).toBe(false)
    expect(isValidCep('00000-000')).toBe(false)
  })
  it('formata de forma progressiva', () => {
    expect(formatCep('01310')).toBe('01310')
    expect(formatCep('013101')).toBe('01310-1')
    expect(formatCep('013101009999')).toBe('01310-100')
  })
})

describe('fillFromCep', () => {
  it('não apaga o que o cliente digitou quando o ViaCEP vem sem rua (CEP de cidade inteira)', () => {
    const current = { street: 'Rua Única', neighborhood: 'Centro', city: '', state: '' }
    expect(
      fillFromCep(current, { street: '', neighborhood: '', city: 'Cidade', state: 'MG' }),
    ).toEqual({ street: 'Rua Única', neighborhood: 'Centro', city: 'Cidade', state: 'MG' })
  })
})
