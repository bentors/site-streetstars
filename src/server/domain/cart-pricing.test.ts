import { describe, expect, it } from 'vitest'
import { lineKey } from '@/lib/cart'
import { priceLines } from './cart-pricing'

const tee = {
  id: 'p1',
  slug: 'camiseta',
  name: 'Camiseta',
  priceCents: 14990,
  sizes: ['P', 'M'],
  colors: [
    { name: 'Preto', hex: '#000000', image: 'https://img/preto.jpg' },
    { name: 'Branco', hex: '#ffffff', image: null },
  ],
  images: [{ url: 'https://img/capa.jpg', publicId: 'capa', alt: '' }],
  status: 'active' as const,
}
const cap = {
  ...tee,
  id: 'p2',
  slug: 'bone',
  name: 'Boné',
  priceCents: 12990,
  sizes: ['UN'],
  colors: [],
}

describe('priceLines', () => {
  it('usa preço do catálogo e imagem da cor', () => {
    const result = priceLines(
      [
        { productId: 'p1', size: 'M', color: 'Preto', qty: 2 },
        { productId: 'p1', size: 'P', color: 'Branco', qty: 1 },
        { productId: 'p2', size: 'UN', color: null, qty: 1 },
      ],
      [tee, cap],
    )
    expect(result.lines.map((l) => [l.name, l.image, l.unitPriceCents, l.lineTotalCents])).toEqual([
      ['Camiseta', 'https://img/preto.jpg', 14990, 29980],
      ['Camiseta', 'https://img/capa.jpg', 14990, 14990],
      ['Boné', 'https://img/capa.jpg', 12990, 12990],
    ])
    expect(result.subtotalCents).toBe(57960)
    expect(result.removedKeys).toEqual([])
  })

  it('remove o que não pode ser comprado', () => {
    const lines = [
      { productId: 'fantasma', size: 'M', color: null, qty: 1 },
      { productId: 'p1', size: 'XG', color: 'Preto', qty: 1 },
      { productId: 'p1', size: 'M', color: 'Roxo', qty: 1 },
      { productId: 'p1', size: 'M', color: null, qty: 1 },
      { productId: 'p2', size: 'UN', color: 'Preto', qty: 1 },
      { productId: 'p3', size: 'M', color: null, qty: 1 },
    ]
    const result = priceLines(lines, [tee, cap, { ...cap, id: 'p3', status: 'draft' as const }])
    expect(result.lines).toEqual([])
    expect(result.removedKeys).toEqual(lines.map(lineKey))
    expect(result.subtotalCents).toBe(0)
  })

  it('limita a quantidade mesmo se o cliente mandar mais', () => {
    const result = priceLines([{ productId: 'p2', size: 'UN', color: null, qty: 50 }], [cap])
    expect(result.lines[0]?.qty).toBe(10)
  })
})
