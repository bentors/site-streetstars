import { beforeEach, describe, expect, it } from 'vitest'
import type { CollectionDoc, ProductDoc } from '@/lib/catalog-schemas'
import { DEFAULT_STORE_SETTINGS } from '@/lib/store-settings'
import { getPublishedCollectionBySlug, listPublishedCollections } from '@/server/db/collections'
import { db } from '@/server/db/firebase-admin'
import { getActiveProductBySlug, getProductsByIds, listActiveProducts } from '@/server/db/products'
import { getStoreSettings } from '@/server/db/settings'
import { clearFirestore } from './helpers'

const now = new Date('2026-01-01T00:00:00.000Z')

function product(overrides: Partial<ProductDoc> = {}): ProductDoc {
  return {
    slug: 'camiseta',
    name: 'Camiseta',
    description: 'Algodão',
    category: 'SUPERIORES',
    priceCents: 14990,
    weightGrams: 250,
    productionDays: 10,
    sizes: ['P', 'M'],
    colors: [{ name: 'Preto', hex: '#000000', image: null }],
    images: [
      { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a', alt: 'Camiseta' },
    ],
    highlights: [],
    sizeGuide: null,
    collectionIds: [],
    status: 'active',
    featured: false,
    featuredOrder: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function collection(overrides: Partial<CollectionDoc> = {}): CollectionDoc {
  return {
    slug: 'drop-1',
    title: 'Drop 1',
    shortDescription: 'Primeiro drop',
    body: ['Texto'],
    credits: { photo: 'A', direction: 'B', styling: 'C' },
    coverImage: 'https://res.cloudinary.com/x/image/upload/c.jpg',
    hoverImage: null,
    gallery: [],
    status: 'published',
    order: 0,
    launchedAt: null,
    ...overrides,
  }
}

beforeEach(clearFirestore)

describe('products repository', () => {
  it('lista só os ativos', async () => {
    await db().doc('products/p1').set(product())
    await db()
      .doc('products/p2')
      .set(product({ slug: 'rascunho', status: 'draft' }))
    await db()
      .doc('products/p3')
      .set(product({ slug: 'arquivado', status: 'archived' }))
    expect((await listActiveProducts()).map((p) => p.id)).toEqual(['p1'])
  })

  it('busca por slug só entre os ativos', async () => {
    await db().doc('products/p1').set(product())
    await db()
      .doc('products/p2')
      .set(product({ slug: 'rascunho', status: 'draft' }))
    expect((await getActiveProductBySlug('camiseta'))?.id).toBe('p1')
    expect(await getActiveProductBySlug('rascunho')).toBeNull()
    expect(await getActiveProductBySlug('nao-existe')).toBeNull()
  })

  it('busca por ids ignorando os que não existem e repetidos', async () => {
    await db().doc('products/p1').set(product())
    const found = await getProductsByIds(['p1', 'p1', 'fantasma'])
    expect(found.map((p) => p.id)).toEqual(['p1'])
    expect(found[0]?.createdAt).toEqual(now)
  })
})

describe('collections repository', () => {
  it('lista publicadas em ordem e busca por slug', async () => {
    await db()
      .doc('collections/b')
      .set(collection({ slug: 'b', order: 2 }))
    await db()
      .doc('collections/a')
      .set(collection({ slug: 'a', order: 1 }))
    await db()
      .doc('collections/c')
      .set(collection({ slug: 'c', status: 'draft' }))
    expect((await listPublishedCollections()).map((c) => c.slug)).toEqual(['a', 'b'])
    expect((await getPublishedCollectionBySlug('a'))?.title).toBe('Drop 1')
    expect(await getPublishedCollectionBySlug('c')).toBeNull()
  })
})

describe('settings repository', () => {
  it('usa os padrões quando settings/store não existe', async () => {
    expect(await getStoreSettings()).toEqual(DEFAULT_STORE_SETTINGS)
  })

  it('lê o documento quando existe', async () => {
    await db()
      .doc('settings/store')
      .set({ ...DEFAULT_STORE_SETTINGS, whatsapp: '5511912345678' })
    expect((await getStoreSettings()).whatsapp).toBe('5511912345678')
  })
})
