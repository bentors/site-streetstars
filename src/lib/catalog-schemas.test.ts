import { describe, expect, it } from 'vitest'
import { productSchema } from './catalog-schemas'

const URL = 'https://res.cloudinary.com/x/image/upload'
const stored = {
  slug: 'camiseta',
  name: 'Camiseta',
  description: '',
  category: 'SUPERIORES',
  priceCents: 14990,
  weightGrams: 250,
  productionDays: 10,
  sizes: ['P'],
  colors: [
    { name: 'Preto', hex: '#000000', image: `${URL}/capa.jpg` },
    { name: 'Branco', hex: '#ffffff', image: `${URL}/branco.jpg` },
    { name: 'Rosa', hex: '#ff00aa', image: null },
  ],
  images: [{ url: `${URL}/capa.jpg`, publicId: 'capa', alt: 'Capa' }],
  highlights: [],
  sizeGuide: null,
  collectionIds: [],
  status: 'active',
  featured: false,
  featuredOrder: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('productSchema', () => {
  it('acrescenta à galeria, marcada com a cor, a foto antiga da cor que estava fora dela', () => {
    const product = productSchema.parse(stored)
    expect(product.colors).toEqual([
      { name: 'Preto', hex: '#000000' },
      { name: 'Branco', hex: '#ffffff' },
      { name: 'Rosa', hex: '#ff00aa' },
    ])
    expect(product.images).toEqual([
      // Já estava na galeria: continua aparecendo para todas as cores.
      { url: `${URL}/capa.jpg`, publicId: 'capa', alt: 'Capa', colors: [] },
      {
        url: `${URL}/branco.jpg`,
        publicId: 'branco',
        alt: 'Camiseta — Branco',
        colors: ['Branco'],
      },
    ])
  })

  it('mantém o formato novo como está', () => {
    const images = [{ url: `${URL}/a.jpg`, publicId: 'a', alt: '', colors: ['Preto'] }]
    const product = productSchema.parse({
      ...stored,
      colors: [{ name: 'Preto', hex: '#000000' }],
      images,
    })
    expect(product.images).toEqual(images)
  })
})
