import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/env'
import { buildSitemap } from '@/lib/seo'
import { getShopProducts, getStoreCollections } from '@/server/catalog'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getShopProducts(), getStoreCollections()])
  return buildSitemap(publicEnv().NEXT_PUBLIC_SITE_URL, { products, collections })
}
