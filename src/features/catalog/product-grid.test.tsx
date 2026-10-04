import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ProductGrid } from './product-grid'

const img = 'https://res.cloudinary.com/x/image/upload/a.jpg'
const products = [
  {
    id: '1',
    slug: 'camiseta',
    name: 'Camiseta',
    priceCents: 14990,
    category: 'SUPERIORES',
    image: img,
  },
  { id: '2', slug: 'bone', name: 'Boné', priceCents: 12990, category: 'ACESSÓRIOS', image: img },
]

describe('ProductGrid', () => {
  it('filtra por categoria e só mostra categorias com produto', async () => {
    render(<ProductGrid products={products} />)
    expect(screen.queryByRole('button', { name: 'INFERIORES' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'ACESSÓRIOS' }))

    expect(screen.getByRole('link', { name: /boné/i })).toHaveAttribute('href', '/produto/bone')
    expect(screen.queryByRole('link', { name: /camiseta/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ACESSÓRIOS' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('mostra aviso quando não há produtos', () => {
    render(<ProductGrid products={[]} />)
    expect(screen.getByText('Novidades em breve.')).toBeInTheDocument()
  })
})
