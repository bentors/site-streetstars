import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrderList, type OrderRow } from './order-list'

const row: OrderRow = {
  id: 'o1',
  number: 'SS-1042',
  status: 'in_production',
  totalCents: 32480,
  itemCount: 2,
  createdAt: new Date('2026-10-10T15:00:00Z'),
  href: '/pedido/o1.sig',
}

describe('OrderList', () => {
  it('mostra número, data, status, itens e total com link para o pedido', () => {
    render(<OrderList orders={[row]} />)
    const link = screen.getByRole('link', { name: /SS-1042/ })
    expect(link).toHaveAttribute('href', '/pedido/o1.sig')
    expect(link).toHaveTextContent('10/10/2026')
    expect(link).toHaveTextContent('Em produção')
    expect(link).toHaveTextContent('2 itens')
    expect(link).toHaveTextContent(/R\$\s324,80/)
  })

  it('lista vazia convida a comprar', () => {
    render(<OrderList orders={[]} />)
    expect(screen.getByText('Você ainda não fez pedidos.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/#shop')
  })
})
