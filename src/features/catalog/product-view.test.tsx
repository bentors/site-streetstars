import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/cart/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }))

import type { StoreProduct } from '@/server/catalog'
import { ProductView } from './product-view'

const URL = 'https://res.cloudinary.com/x/image/upload'
const image = (name: string, colors: string[]) => ({
  url: `${URL}/${name}.jpg`,
  publicId: name,
  alt: name,
  colors,
})

const product = {
  id: 'p1',
  slug: 'camiseta',
  name: 'Camiseta',
  description: '',
  category: 'SUPERIORES',
  priceCents: 14990,
  weightGrams: 250,
  productionDays: 10,
  sizes: ['P'],
  colors: [
    { name: 'Preto', hex: '#000000' },
    { name: 'Branco', hex: '#ffffff' },
  ],
  images: [
    image('geral', []),
    image('preto', ['Preto']),
    image('branco', ['Branco']),
    image('dupla', ['Preto', 'Branco']),
  ],
  highlights: [],
  sizeGuide: null,
  collectionIds: [],
  status: 'active',
  featured: false,
  featuredOrder: null,
  createdAt: '',
  updatedAt: '',
} as StoreProduct

const photos = () => screen.getAllByRole('img').map((img) => img.getAttribute('alt'))

describe('ProductView', () => {
  it('mostra só as fotos da cor escolhida e as gerais', async () => {
    render(<ProductView product={product} />)
    expect(photos()).toEqual(['geral', 'preto', 'branco', 'dupla'])

    await userEvent.click(screen.getByRole('button', { name: 'Cor Branco' }))
    expect(photos()).toEqual(['geral', 'branco', 'dupla'])

    await userEvent.click(screen.getByRole('button', { name: 'Cor Preto' }))
    expect(photos()).toEqual(['geral', 'preto', 'dupla'])
  })

  it('cor sem nenhuma foto para mostrar exibe todas em vez de galeria vazia', async () => {
    render(
      <ProductView
        product={{
          ...product,
          colors: [...product.colors, { name: 'Rosa', hex: '#ff00aa' }],
          images: [image('preto', ['Preto']), image('branco', ['Branco'])],
        }}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cor Rosa' }))
    expect(photos()).toEqual(['preto', 'branco'])
  })
})
