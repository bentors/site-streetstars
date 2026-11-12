import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrderTable, type AdminOrderRow } from './order-table'

const row: AdminOrderRow = {
  id: 'o1',
  number: 'SS-1042',
  createdAt: new Date('2026-10-10T15:00:00Z'),
  customerName: 'Ana Souza',
  customerEmail: 'ana@exemplo.com',
  status: 'paid',
  totalCents: 32480,
  unseen: true,
}

describe('OrderTable', () => {
  it('mostra o pedido com link para o detalhe e marca os novos', () => {
    render(<OrderTable orders={[row, { ...row, id: 'o2', number: 'SS-1043', unseen: false }]} />)
    expect(screen.getByRole('link', { name: 'SS-1042' })).toHaveAttribute(
      'href',
      '/admin/pedidos/o1',
    )
    expect(screen.getAllByText('Ana Souza')).toHaveLength(2)
    expect(screen.getAllByText('Pagamento confirmado')).toHaveLength(2)
    expect(screen.getAllByText('Novo')).toHaveLength(1)
    expect(screen.getAllByText(/R\$\s324,80/)).toHaveLength(2)
  })

  it('lista vazia avisa', () => {
    render(<OrderTable orders={[]} />)
    expect(screen.getByText('Nenhum pedido encontrado.')).toBeInTheDocument()
  })
})
