import { describe, expect, it } from 'vitest'
import { formatCep, isValidCep, normalizeCep } from './cep'

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
