import 'server-only'
import { unstable_cache } from 'next/cache'
import { sortForShop } from '@/lib/catalog'
import {
  getPublishedCollectionBySlug,
  listPublishedCollections,
  type Collection,
} from '@/server/db/collections'
import { getActiveProductBySlug, listActiveProducts, type Product } from '@/server/db/products'
import { getStoreSettings } from '@/server/db/settings'

export const CATALOG_TAG = 'catalog'
const options = { tags: [CATALOG_TAG], revalidate: 3600 }

// unstable_cache serializa em JSON: datas viram texto, então os tipos da loja já usam string.
export type StoreProduct = Omit<Product, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}
export type StoreCollection = Omit<Collection, 'launchedAt'> & { launchedAt: string | null }

function toStoreProduct(product: Product): StoreProduct {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

function toStoreCollection(collection: Collection): StoreCollection {
  return { ...collection, launchedAt: collection.launchedAt?.toISOString() ?? null }
}

export const getShopProducts = unstable_cache(
  async () => sortForShop((await listActiveProducts()).map(toStoreProduct)),
  ['shop-products'],
  options,
)

export const getStoreProduct = unstable_cache(
  async (slug: string) => {
    const product = await getActiveProductBySlug(slug)
    return product ? toStoreProduct(product) : null
  },
  ['store-product'],
  options,
)

export const getStoreCollections = unstable_cache(
  async () => (await listPublishedCollections()).map(toStoreCollection),
  ['store-collections'],
  options,
)

export const getStoreCollection = unstable_cache(
  async (slug: string) => {
    const collection = await getPublishedCollectionBySlug(slug)
    return collection ? toStoreCollection(collection) : null
  },
  ['store-collection'],
  options,
)

export const getCachedStoreSettings = unstable_cache(getStoreSettings, ['store-settings'], options)
