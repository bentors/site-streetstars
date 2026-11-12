import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, fromSaoPauloInput, toSaoPauloInput } from './format-date'

const instant = new Date('2026-11-01T02:30:00Z') // 31/10 23:30 em São Paulo

describe('format-date', () => {
  it('formata no fuso de São Paulo', () => {
    expect(formatDate(instant)).toBe('31/10/2026')
    expect(formatDateTime(instant)).toBe('31/10/2026, 23:30')
  })

  it('converte para os inputs date e datetime-local', () => {
    expect(toSaoPauloInput(instant, true)).toBe('2026-10-31T23:30')
    expect(toSaoPauloInput(instant, false)).toBe('2026-10-31')
    expect(toSaoPauloInput(null, true)).toBe('')
  })

  it('lê o que o admin digitou como horário de São Paulo', () => {
    expect(fromSaoPauloInput('2026-11-01T00:00')?.toISOString()).toBe('2026-11-01T03:00:00.000Z')
    expect(fromSaoPauloInput('2026-11-01')?.toISOString()).toBe('2026-11-01T03:00:00.000Z')
    expect(fromSaoPauloInput('')).toBeNull()
    expect(fromSaoPauloInput('ontem')).toBeNull()
  })

  it('ida e volta preserva o valor', () => {
    expect(toSaoPauloInput(fromSaoPauloInput('2026-12-24T18:45'), true)).toBe('2026-12-24T18:45')
  })
})
