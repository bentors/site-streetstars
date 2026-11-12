import { describe, expect, it } from 'vitest'
import { parseCatalog, serializeCatalog } from './catalog-transfer'

describe('catalog transfer', () => {
  it('ida e volta preserva datas', () => {
    const docs = [
      {
        collection: 'products',
        id: 'p1',
        data: { name: 'X', createdAt: new Date('2026-10-01T00:00:00Z'), tags: ['a'] },
      },
    ]
    const back = parseCatalog(serializeCatalog(docs))
    expect(back).toEqual(docs)
    expect(back[0]?.data.createdAt).toBeInstanceOf(Date)
  })

  it('recusa coleção fora do catálogo e id com caminho', () => {
    expect(() =>
      parseCatalog(JSON.stringify([{ collection: 'orders', id: 'o1', data: {} }])),
    ).toThrow()
    expect(() =>
      parseCatalog(JSON.stringify([{ collection: 'products', id: '../x', data: {} }])),
    ).toThrow()
  })
})
