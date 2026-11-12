import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CartProvider } from '@/features/cart/cart-context'
import { SiteHeader } from './site-header'

vi.mock('next/navigation', () => ({ usePathname: () => '/produto/x' }))

describe('SiteHeader', () => {
  it('fecha o menu mobile com Esc', async () => {
    render(
      <CartProvider>
        <SiteHeader />
      </CartProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByRole('navigation', { name: 'Navegação mobile' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('navigation', { name: 'Navegação mobile' })).not.toBeInTheDocument()
  })
})
