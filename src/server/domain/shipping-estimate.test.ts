import { describe, expect, it } from 'vitest'
import { cartPackage } from './shipping-estimate'

const products = [
  { id: 'tee', weightGrams: 250, productionDays: 10 },
  { id: 'hoodie', weightGrams: 700, productionDays: 15 },
]

describe('cartPackage', () => {
  it('soma o peso por quantidade e usa o maior prazo de produção', () => {
    expect(
      cartPackage(
        [
          { productId: 'tee', qty: 2 },
          { productId: 'hoodie', qty: 1 },
        ],
        products,
      ),
    ).toEqual({ weightGrams: 1200, productionDays: 15 })
  })

  it('falha se faltar o produto (não cota frete com peso errado)', () => {
    expect(() => cartPackage([{ productId: 'sumiu', qty: 1 }], products)).toThrow('sumiu')
  })
})
