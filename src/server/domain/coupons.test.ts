import { describe, expect, it } from 'vitest'
import { applyCoupon, isCouponCode, normalizeCouponCode, type CouponRule } from './coupons'

const NOW = new Date('2026-10-04T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

const base: CouponRule = {
  code: 'BEMVINDO',
  type: 'percent',
  value: 10,
  minSubtotalCents: null,
  startsAt: null,
  endsAt: null,
  maxUses: null,
  usedCount: 0,
  active: true,
}

describe('applyCoupon', () => {
  it('percentual arredonda para baixo', () => {
    expect(applyCoupon(base, 14995, NOW)).toEqual({
      ok: true,
      data: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 1499 },
    })
  })

  it('100% zera o subtotal', () => {
    const result = applyCoupon({ ...base, value: 100 }, 29980, NOW)
    expect(result).toMatchObject({ ok: true, data: { discountCents: 29980 } })
  })

  it('valor fixo é limitado ao subtotal', () => {
    const result = applyCoupon({ ...base, type: 'fixed', value: 50000 }, 29980, NOW)
    expect(result).toMatchObject({ ok: true, data: { discountCents: 29980 } })
  })

  it('vale dentro da janela, inclusive no último instante', () => {
    const result = applyCoupon(
      { ...base, startsAt: new Date(NOW.getTime() - DAY), endsAt: NOW },
      10000,
      NOW,
    )
    expect(result.ok).toBe(true)
  })

  it.each([
    ['inexistente', null, 'coupon_invalid'],
    ['inativo', { ...base, active: false }, 'coupon_invalid'],
    ['antes do início', { ...base, startsAt: new Date(NOW.getTime() + DAY) }, 'coupon_not_started'],
    ['expirado', { ...base, endsAt: new Date(NOW.getTime() - 1) }, 'coupon_expired'],
    ['esgotado', { ...base, maxUses: 3, usedCount: 3 }, 'coupon_exhausted'],
    ['abaixo do mínimo', { ...base, minSubtotalCents: 20000 }, 'coupon_min_subtotal'],
  ] as const)('recusa cupom %s', (_, coupon, code) => {
    expect(applyCoupon(coupon, 19990, NOW)).toMatchObject({ ok: false, code })
  })

  it('mensagem do mínimo mostra o valor em reais', () => {
    const result = applyCoupon({ ...base, minSubtotalCents: 20000 }, 19990, NOW)
    expect(result.ok ? '' : result.message).toMatch(/R\$\s200,00/)
  })
})

describe('código do cupom', () => {
  it('normaliza espaços e caixa', () => {
    expect(normalizeCouponCode('  bemVindo ')).toBe('BEMVINDO')
  })

  it.each([
    ['BEMVINDO', true],
    ['DROP_2026-X', true],
    ['', false],
    ['COM ESPAÇO', false],
    ['A/B', false],
    ['X'.repeat(33), false],
  ])('%j válido? %s', (code, expected) => {
    expect(isCouponCode(code)).toBe(expected)
  })
})
