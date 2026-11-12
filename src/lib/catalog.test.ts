import { describe, expect, it } from 'vitest'
import { slugify, sortForShop } from './catalog'

describe('slugify', () => {
  it.each([
    ["T-Shirt Boxy 'Arabic Logo'", 't-shirt-boxy-arabic-logo'],
    ['Boné  Ação Çedilha', 'bone-acao-cedilha'],
    ['  Hoodie / Regular  ', 'hoodie-regular'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })
})

describe('sortForShop', () => {
  it('destaques primeiro (por featuredOrder), depois os mais antigos primeiro', () => {
    const items = [
      { id: 'a', featured: false, featuredOrder: null, createdAt: '2026-01-03T00:00:00.000Z' },
      { id: 'b', featured: true, featuredOrder: 2, createdAt: '2026-01-05T00:00:00.000Z' },
      { id: 'c', featured: false, featuredOrder: null, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'd', featured: true, featuredOrder: 1, createdAt: '2026-01-09T00:00:00.000Z' },
    ]
    expect(sortForShop(items).map((i) => i.id)).toEqual(['d', 'b', 'c', 'a'])
  })
})
