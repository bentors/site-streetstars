import { describe, expect, it } from 'vitest'
import { formatBRL, formatCentsInput, isCents, parseReaisToCents, toCents } from './money'

describe('formatBRL', () => {
  it('formata centavos em reais', () => {
    expect(formatBRL(12990)).toBe('R$ 129,90')
    expect(formatBRL(0)).toBe('R$ 0,00')
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89')
  })
})

describe('toCents', () => {
  it('converte reais em centavos inteiros', () => {
    expect(toCents(129.9)).toBe(12990)
    expect(toCents(0.1 + 0.2)).toBe(30)
  })
  it('recusa valores negativos ou não finitos', () => {
    expect(() => toCents(-1)).toThrow(RangeError)
    expect(() => toCents(Number.NaN)).toThrow(RangeError)
  })
})

describe('parseReaisToCents', () => {
  it.each([
    ['129,90', 12990],
    ['129.9', 12990],
    ['129', 12900],
    [' 5,5 ', 550],
    ['0,01', 1],
  ])('%s → %i', (input, expected) => {
    expect(parseReaisToCents(input)).toBe(expected)
  })
  it.each(['', 'abc', '1.299,90', '10,999', '-5', '12,'])('recusa %s', (input) => {
    expect(parseReaisToCents(input)).toBeNull()
  })
})

describe('isCents', () => {
  it('aceita só inteiros não negativos', () => {
    expect(isCents(100)).toBe(true)
    expect(isCents(0)).toBe(true)
    expect(isCents(1.5)).toBe(false)
    expect(isCents(-1)).toBe(false)
    expect(isCents('100')).toBe(false)
  })
})

describe('formatCentsInput', () => {
  it.each([
    [14990, '149,90'],
    [5, '0,05'],
    [100, '1,00'],
  ])('%i → %s', (cents, text) => {
    expect(formatCentsInput(cents)).toBe(text)
    expect(parseReaisToCents(text)).toBe(cents)
  })
})
