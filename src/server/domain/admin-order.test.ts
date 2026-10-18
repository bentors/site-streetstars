import { describe, expect, it } from 'vitest'
import { adminTargets, trackingUrl } from './admin-order'

describe('adminTargets', () => {
  it.each([
    ['pending_payment', ['cancelled']],
    ['expired', []],
    ['paid', ['in_production', 'cancelled', 'refunded']],
    ['in_production', ['shipped', 'refunded']],
    ['shipped', ['delivered', 'refunded']],
    ['delivered', ['refunded']],
    ['cancelled', []],
    ['refunded', []],
  ] as const)('%s → %j', (from, expected) => {
    expect(adminTargets(from)).toEqual(expected)
  })
})

describe('trackingUrl', () => {
  it('aponta para o Melhor Rastreio', () => {
    expect(trackingUrl('AB123456789BR')).toBe(
      'https://melhorrastreio.com.br/rastreio/AB123456789BR',
    )
  })
})
