import { describe, expect, it } from 'vitest'
import { computeTotals } from './pricing'

describe('computeTotals', () => {
  it('subtotal − desconto + frete', () => {
    expect(
      computeTotals({ subtotalCents: 29980, discountCents: 2998, shippingCents: 2500 }),
    ).toEqual({ subtotalCents: 29980, discountCents: 2998, shippingCents: 2500, totalCents: 29482 })
  })

  it('desconto nunca passa do subtotal (o total fica igual ao frete)', () => {
    expect(
      computeTotals({ subtotalCents: 5000, discountCents: 9000, shippingCents: 2500 }),
    ).toEqual({ subtotalCents: 5000, discountCents: 5000, shippingCents: 2500, totalCents: 2500 })
  })

  it.each([
    { subtotalCents: -1, discountCents: 0, shippingCents: 0 },
    { subtotalCents: 100, discountCents: 0.5, shippingCents: 0 },
    { subtotalCents: 100, discountCents: 0, shippingCents: Number.NaN },
  ])('recusa valor que não é centavo inteiro: %j', (input) => {
    expect(() => computeTotals(input)).toThrow(RangeError)
  })
})
