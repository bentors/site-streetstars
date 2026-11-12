import { describe, expect, it } from 'vitest'
import { collectionSchema } from '../../src/lib/catalog-schemas'
import {
  estimateWeightGrams,
  isMigrated,
  migrateProduct,
  uniqueSlugs,
  type LegacyProduct,
} from './catalog-migration'
import { LEGACY_COLLECTIONS } from './legacy-collections'

const IMG = 'https://res.cloudinary.com/dmsvju9ca/image/upload/v1/produtos/tshirt.jpg'
const IMG2 = 'https://res.cloudinary.com/dmsvju9ca/image/upload/v1/produtos/tshirt-2.jpg'
const created = new Date('2026-01-10T00:00:00.000Z')
const now = new Date('2026-10-03T00:00:00.000Z')

const legacy: LegacyProduct = {
  name: "T-Shirt Boxy 'Arabic Logo'",
  price: 149.9,
  description: 'Camiseta boxy',
  category: 'SUPERIORES',
  sizes: ['P', 'M', 'G', 'GG'],
  colors: [
    { name: 'Preto', hex: '#000000', img: IMG2 },
    { name: 'Branco', hex: '#ffffff' },
  ],
  details: ['Modelagem oversized', '  ', 'Algodão 100%'],
  features: [],
  measurements: { columns: ['Tam', 'Largura'], rows: [{ size: 'P', values: ['55'] }] },
  img: IMG,
  gallery: [IMG, IMG2],
  isActive: true,
  isFeatured: false,
  created_at: created,
  updated_at: created,
}

describe('migrateProduct', () => {
  it('converte o formato antigo para o novo', () => {
    const doc = migrateProduct(legacy, {
      slug: 't-shirt-boxy-arabic-logo',
      featuredOrder: null,
      now,
    })
    expect(doc).toMatchObject({
      slug: 't-shirt-boxy-arabic-logo',
      name: "T-Shirt Boxy 'Arabic Logo'",
      priceCents: 14990,
      weightGrams: 250,
      productionDays: 10,
      status: 'active',
      featured: false,
      featuredOrder: null,
      highlights: ['Modelagem oversized', 'Algodão 100%'],
      sizeGuide: { columns: ['Tam', 'Largura'], rows: [{ size: 'P', values: ['55'] }] },
      collectionIds: [],
      createdAt: created,
      updatedAt: now,
    })
    expect(doc.colors).toEqual([
      { name: 'Preto', hex: '#000000', image: IMG2 },
      { name: 'Branco', hex: '#ffffff', image: null },
    ])
    expect(doc.images).toEqual([
      { url: IMG, publicId: 'produtos/tshirt', alt: "T-Shirt Boxy 'Arabic Logo' — foto 1" },
      { url: IMG2, publicId: 'produtos/tshirt-2', alt: "T-Shirt Boxy 'Arabic Logo' — foto 2" },
    ])
  })

  it('produto inativo vira rascunho e destaque guarda a ordem', () => {
    const doc = migrateProduct(
      { ...legacy, isActive: false, isFeatured: true },
      { slug: 'x', featuredOrder: 0, now },
    )
    expect(doc.status).toBe('draft')
    expect(doc).toMatchObject({ featured: true, featuredOrder: 0 })
  })

  it('usa features quando não há details e aceita produto sem guia e sem data', () => {
    const doc = migrateProduct(
      {
        ...legacy,
        details: undefined,
        features: ['Aba curva'],
        measurements: undefined,
        created_at: undefined,
      },
      { slug: 'x', featuredOrder: null, now },
    )
    expect(doc.highlights).toEqual(['Aba curva'])
    expect(doc.sizeGuide).toBeNull()
    expect(doc.createdAt).toEqual(now)
  })

  it('recusa categoria desconhecida', () => {
    expect(() =>
      migrateProduct({ ...legacy, category: 'OUTROS' }, { slug: 'x', featuredOrder: null, now }),
    ).toThrow()
  })
})

describe('estimateWeightGrams', () => {
  it.each([
    ["T-Shirt Regular 'MAMR'", 250],
    ["Hoodie Boxy 'Arabic Logo'", 700],
    ["Trucker Cap 'Arabic Logo'", 150],
    ["Beanie 'SS Logo'", 120],
    ['Calça Cargo', 300],
  ])('%s → %i g', (name, grams) => {
    expect(estimateWeightGrams(name)).toBe(grams)
  })
})

describe('uniqueSlugs e isMigrated', () => {
  it('não repete slug de produto já migrado', () => {
    expect(uniqueSlugs(['Camiseta'], ['camiseta'])).toEqual(['camiseta-2'])
    expect(uniqueSlugs(['Camiseta', 'Camiseta'], ['camiseta', 'camiseta-2'])).toEqual([
      'camiseta-3',
      'camiseta-4',
    ])
  })

  it('desempata slugs repetidos', () => {
    expect(uniqueSlugs(['Camiseta', 'Camiseta', 'Boné'])).toEqual([
      'camiseta',
      'camiseta-2',
      'bone',
    ])
  })

  it('reconhece documento já migrado', () => {
    expect(isMigrated({ priceCents: 100 })).toBe(true)
    expect(isMigrated({ price: 1 })).toBe(false)
  })
})

describe('LEGACY_COLLECTIONS', () => {
  it('são válidas e só o drop em construção fica em rascunho', () => {
    for (const collection of LEGACY_COLLECTIONS) collectionSchema.parse(collection)
    expect(LEGACY_COLLECTIONS.map((c) => [c.slug, c.status])).toEqual([
      ['every-star-is-unique', 'published'],
      ['mais-amor-menos-recalque', 'published'],
      ['new-drop', 'draft'],
    ])
  })
})
