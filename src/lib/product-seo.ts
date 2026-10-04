import type { ProductDoc } from './catalog-schemas'
import { cloudinaryUrl } from './cloudinary'

export function productJsonLd(
  product: Pick<ProductDoc, 'name' | 'slug' | 'description' | 'priceCents' | 'images'>,
  siteUrl: string,
): Record<string, unknown> {
  const url = `${siteUrl}/produto/${product.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((image) => cloudinaryUrl(image.url, { width: 1200, format: 'jpg' })),
    brand: { '@type': 'Brand', name: 'Street Stars' },
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
    },
  }
}
