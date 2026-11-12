import { beforeEach, describe, expect, it } from 'vitest'
import type { ProductInput } from '@/lib/admin-product'
import type { CollectionDoc } from '@/lib/catalog-schemas'
import {
  getCollectionById,
  listAllCollections,
  listPublishedCollections,
  saveCollection,
} from '@/server/db/collections'
import { db } from '@/server/db/firebase-admin'
import {
  getProductById,
  listActiveProducts,
  listAllProducts,
  saveProduct,
  setProductFeatured,
  setProductStatus,
} from '@/server/db/products'
import { NOW, productDoc } from './fixtures'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

const LATER = new Date(NOW.getTime() + 60_000)

function input(): ProductInput {
  const doc: Partial<ReturnType<typeof productDoc>> = productDoc()
  delete doc.featured
  delete doc.featuredOrder
  delete doc.createdAt
  delete doc.updatedAt
  return doc as ProductInput
}

function unwrap<T>(result: { ok: true; data: T } | { ok: false; message: string }): T {
  if (!result.ok) throw new Error(result.message)
  return result.data
}

describe('produtos', () => {
  it('cria rascunho, edita, ativa e destaca', async () => {
    const { id } = unwrap(await saveProduct(null, { ...input(), status: 'draft' }, NOW))
    expect(await listActiveProducts()).toEqual([])

    unwrap(await saveProduct(id, { ...input(), name: 'Camiseta Nova', status: 'draft' }, LATER))
    unwrap(await setProductStatus(id, 'active', LATER))
    unwrap(await setProductFeatured(id, true, 2, LATER))

    expect(await getProductById(id)).toMatchObject({
      name: 'Camiseta Nova',
      status: 'active',
      featured: true,
      featuredOrder: 2,
      createdAt: NOW,
      updatedAt: LATER,
    })
    expect((await listActiveProducts()).map((p) => p.id)).toEqual([id])
  })

  it('tirar o destaque zera a ordem', async () => {
    const { id } = unwrap(await saveProduct(null, input(), NOW))
    unwrap(await setProductFeatured(id, true, 3, NOW))
    unwrap(await setProductFeatured(id, false, 3, LATER))
    expect(await getProductById(id)).toMatchObject({ featured: false, featuredOrder: null })
  })

  it('slug repetido é recusado; o próprio produto pode manter o slug', async () => {
    const { id } = unwrap(await saveProduct(null, input(), NOW))
    expect(await saveProduct(null, input(), NOW)).toMatchObject({ ok: false, code: 'slug_taken' })
    expect(await saveProduct(id, input(), LATER)).toMatchObject({ ok: true })
  })

  it('editar ou mudar status de produto inexistente dá not_found', async () => {
    expect(await saveProduct('zzz', input(), NOW)).toMatchObject({ code: 'not_found' })
    expect(await setProductStatus('zzz', 'active', NOW)).toMatchObject({ code: 'not_found' })
  })

  it('o admin vê rascunhos, arquivados e o editado por último primeiro', async () => {
    const a = unwrap(await saveProduct(null, { ...input(), slug: 'a', status: 'archived' }, NOW))
    const b = unwrap(await saveProduct(null, { ...input(), slug: 'b' }, LATER))
    expect((await listAllProducts()).map((p) => p.id)).toEqual([b.id, a.id])
  })

  it('não grava documento que a vitrine descartaria', async () => {
    await expect(saveProduct(null, { ...input(), images: [] }, NOW)).rejects.toThrow()
    expect((await db().collection('products').get()).size).toBe(0)
  })
})

describe('coleções', () => {
  const collection = (overrides: Partial<CollectionDoc> = {}): CollectionDoc => ({
    slug: 'verao',
    title: 'Verão',
    shortDescription: '',
    body: ['Texto'],
    credits: { photo: '', direction: '', styling: '' },
    coverImage: 'https://res.cloudinary.com/x/image/upload/c.jpg',
    hoverImage: null,
    gallery: [],
    status: 'draft',
    order: 2,
    launchedAt: null,
    ...overrides,
  })

  it('cria, publica e lista por ordem', async () => {
    const { id } = unwrap(await saveCollection(null, collection()))
    unwrap(await saveCollection(null, collection({ slug: 'inverno', order: 1 })))
    expect((await listPublishedCollections()).length).toBe(0)
    unwrap(await saveCollection(id, collection({ status: 'published' })))
    expect((await listPublishedCollections()).map((c) => c.id)).toEqual([id])
    expect((await listAllCollections()).map((c) => c.slug)).toEqual(['inverno', 'verao'])
    expect(await getCollectionById(id)).toMatchObject({ status: 'published' })
  })

  it('slug repetido e id inexistente', async () => {
    unwrap(await saveCollection(null, collection()))
    expect(await saveCollection(null, collection())).toMatchObject({ code: 'slug_taken' })
    expect(await saveCollection('zzz', collection({ slug: 'x' }))).toMatchObject({
      code: 'not_found',
    })
  })
})
