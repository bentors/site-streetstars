import { describe, expect, it } from 'vitest'
import { formatPhone, isValidPhone, normalizePhone } from './phone'

describe('phone', () => {
  it('normaliza', () => {
    expect(normalizePhone('(11) 99999-8888')).toBe('11999998888')
  })
  it('valida celular e fixo com DDD', () => {
    expect(isValidPhone('(11) 99999-8888')).toBe(true)
    expect(isValidPhone('(11) 3333-4444')).toBe(true)
    expect(isValidPhone('(11) 89999-8888')).toBe(false)
    expect(isValidPhone('(01) 3333-4444')).toBe(false)
    expect(isValidPhone('123')).toBe(false)
  })
  it('formata de forma progressiva', () => {
    expect(formatPhone('1')).toBe('(1')
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })
})
