import type { MetadataRoute } from 'next'

// Páginas legais não entram: são noindex, e o Search Console reclama de URL noindex no sitemap.
export function buildSitemap(
  siteUrl: string,
  input: {
    products: { slug: string; updatedAt: string }[]
    collections: { slug: string }[]
  },
): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    ...input.products.map((product) => ({
      url: `${siteUrl}/produto/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...input.collections.map((collection) => ({
      url: `${siteUrl}/colecao/${collection.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}

export function buildRobots(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/conta', '/checkout', '/pedido', '/entrar'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
