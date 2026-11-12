import { describe, expect, it } from 'vitest'
import { productJsonLd } from './product-seo'

describe('productJsonLd', () => {
  it('monta o Product do schema.org com preço em reais', () => {
    const data = productJsonLd(
      {
        name: 'Camiseta',
        slug: 'camiseta',
        description: 'Algodão',
        priceCents: 14990,
        images: [
          { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a', alt: '' },
        ],
      },
      'https://streetstars.com.br',
    )
    expect(data).toMatchObject({
      '@type': 'Product',
      name: 'Camiseta',
      brand: { '@type': 'Brand', name: 'Street Stars' },
      offers: {
        '@type': 'Offer',
        price: '149.90',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: 'https://streetstars.com.br/produto/camiseta',
      },
    })
  })
})
