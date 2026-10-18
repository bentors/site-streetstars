import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdmin = vi.hoisted(() => vi.fn())
const updateTag = vi.hoisted(() => vi.fn())
const products = vi.hoisted(() => ({
  saveProduct: vi.fn(),
  setProductStatus: vi.fn(),
  setProductFeatured: vi.fn(),
}))
const collections = vi.hoisted(() => ({ saveCollection: vi.fn() }))
vi.mock('@/server/auth/session', () => ({ requireAdmin }))
vi.mock('next/cache', () => ({ updateTag }))
vi.mock('@/server/db/products', () => products)
vi.mock('@/server/db/collections', () => collections)
vi.mock('@/server/catalog', () => ({ CATALOG_TAG: 'catalog' }))

import { collectionToForm } from '@/lib/admin-collection'
import { productToForm } from '@/lib/admin-product'
import {
  saveCollectionAction,
  saveProductAction,
  setProductFeaturedAction,
  setProductStatusAction,
} from './catalog-actions'

const form = {
  ...productToForm(null),
  name: 'Camiseta',
  price: '149,90',
  weightGrams: '250',
  sizes: 'P, M',
  images: [{ url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a', alt: '' }],
}

beforeEach(() => {
  vi.resetAllMocks()
  requireAdmin.mockResolvedValue({ uid: 'admin' })
  products.saveProduct.mockResolvedValue({ ok: true, data: { id: 'p1' } })
  products.setProductStatus.mockResolvedValue({ ok: true, data: null })
  products.setProductFeatured.mockResolvedValue({ ok: true, data: null })
  collections.saveCollection.mockResolvedValue({ ok: true, data: { id: 'c1' } })
})

describe('saveProductAction', () => {
  it('quem não é admin não grava', async () => {
    requireAdmin.mockRejectedValue(new Error('NOT_FOUND'))
    await expect(saveProductAction(null, form)).rejects.toThrow()
    expect(products.saveProduct).not.toHaveBeenCalled()
  })

  it('valida, grava convertido e atualiza a vitrine', async () => {
    expect(await saveProductAction(null, form)).toEqual({ ok: true, data: { id: 'p1' } })
    expect(products.saveProduct).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ slug: 'camiseta', priceCents: 14990, sizes: ['P', 'M'] }),
      expect.any(Date),
    )
    expect(updateTag).toHaveBeenCalledWith('catalog')
  })

  it('erro de validação volta com o campo e não grava', async () => {
    const result = await saveProductAction(null, { ...form, price: 'x' })
    expect(result).toMatchObject({
      ok: false,
      code: 'invalid_input:price',
      message: 'Preço inválido',
    })
    expect(products.saveProduct).not.toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })

  it('slug repetido não atualiza a vitrine', async () => {
    products.saveProduct.mockResolvedValue({ ok: false, code: 'slug_taken', message: 'x' })
    await saveProductAction(null, form)
    expect(updateTag).not.toHaveBeenCalled()
  })
})

describe('status e destaque', () => {
  it('recusa status desconhecido', async () => {
    expect(await setProductStatusAction('p1', 'deleted')).toMatchObject({ code: 'invalid_input' })
    expect(products.setProductStatus).not.toHaveBeenCalled()
  })

  it('ativa e atualiza a vitrine', async () => {
    await setProductStatusAction('p1', 'active')
    expect(products.setProductStatus).toHaveBeenCalledWith('p1', 'active', expect.any(Date))
    expect(updateTag).toHaveBeenCalledWith('catalog')
  })

  it('destaque exige ordem inteira quando ligado', async () => {
    expect(await setProductFeaturedAction('p1', true, 'x')).toMatchObject({
      code: 'invalid_input',
    })
    await setProductFeaturedAction('p1', true, 2)
    expect(products.setProductFeatured).toHaveBeenCalledWith('p1', true, 2, expect.any(Date))
  })
})

describe('saveCollectionAction', () => {
  it('converte e atualiza a vitrine', async () => {
    await saveCollectionAction(null, {
      ...collectionToForm(null),
      title: 'Verão',
      coverImage: 'https://res.cloudinary.com/x/image/upload/c.jpg',
    })
    expect(collections.saveCollection).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ slug: 'verao', title: 'Verão' }),
    )
    expect(updateTag).toHaveBeenCalledWith('catalog')
  })
})
