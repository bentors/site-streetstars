import { describe, expect, it } from 'vitest'
import { adminTransitionSchema } from './admin-orders'

describe('adminTransitionSchema', () => {
  it('enviado exige código e normaliza para maiúsculas', () => {
    expect(adminTransitionSchema.parse({ to: 'shipped', trackingCode: ' ab123456789br ' })).toEqual(
      { to: 'shipped', trackingCode: 'AB123456789BR' },
    )
    const missing = adminTransitionSchema.safeParse({ to: 'shipped', trackingCode: '' })
    expect(missing.error?.issues[0]?.message).toBe('Informe o código de rastreio.')
  })

  it('cancelar e estornar exigem observação', () => {
    for (const to of ['cancelled', 'refunded'] as const) {
      const result = adminTransitionSchema.safeParse({ to, note: '  ' })
      expect(result.error?.issues[0]?.message).toBe('Descreva o motivo.')
    }
  })

  it('observação vazia some nas outras transições', () => {
    expect(adminTransitionSchema.parse({ to: 'in_production', note: ' ' })).toEqual({
      to: 'in_production',
    })
  })

  it('recusa destino que o admin não escolhe', () => {
    expect(adminTransitionSchema.safeParse({ to: 'paid' }).success).toBe(false)
  })
})
