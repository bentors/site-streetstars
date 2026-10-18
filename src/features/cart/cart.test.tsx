import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const priceCartAction = vi.hoisted(() => vi.fn())
vi.mock('./actions', () => ({ priceCartAction }))

import { CART_STORAGE_KEY } from '@/lib/cart'
import { CartButton } from './cart-button'
import { CartProvider, useCart } from './cart-context'
import { CartDrawer } from './cart-drawer'

function AddButton() {
  const cart = useCart()
  return (
    <button type="button" onClick={() => cart.add({ productId: 'p1', size: 'M', color: 'Preto' })}>
      adicionar
    </button>
  )
}

function renderCart() {
  return render(
    <CartProvider>
      <AddButton />
      <CartButton />
      <CartDrawer />
    </CartProvider>,
  )
}

const priced = (qty: number) => ({
  lines: [
    {
      key: 'p1|M|Preto',
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: 'https://res.cloudinary.com/x/image/upload/a.jpg',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty,
      lineTotalCents: 14990 * qty,
    },
  ],
  removedKeys: [],
  subtotalCents: 14990 * qty,
})

beforeEach(() => {
  localStorage.clear()
  priceCartAction.mockReset()
})

describe('carrinho', () => {
  it('adiciona, abre a gaveta com preço do servidor e grava no localStorage', async () => {
    priceCartAction.mockResolvedValue(priced(1))
    renderCart()

    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }))

    expect(await screen.findByRole('dialog', { name: 'Sua sacola' })).toBeInTheDocument()
    expect(await screen.findByText('Camiseta')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 149,90').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /abrir sacola \(1 item\)/i })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')).toEqual([
      { productId: 'p1', size: 'M', color: 'Preto', qty: 1 },
    ])
  })

  it('remove itens que o servidor recusou e avisa', async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: 'sumiu', size: 'M', color: null, qty: 1 }]),
    )
    priceCartAction.mockResolvedValue({ lines: [], removedKeys: ['sumiu|M|'], subtotalCents: 0 })
    renderCart()

    await userEvent.click(screen.getByRole('button', { name: /abrir sacola/i }))

    expect(
      await screen.findByText('Alguns itens não estão mais disponíveis e foram removidos.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(localStorage.getItem(CART_STORAGE_KEY)).toBe('[]'))
  })

  it('não deixa passar de 10 unidades', async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: 'p1', size: 'M', color: 'Preto', qty: 10 }]),
    )
    priceCartAction.mockResolvedValue(priced(10))
    renderCart()

    await userEvent.click(screen.getByRole('button', { name: /abrir sacola/i }))

    expect(
      await screen.findByRole('button', { name: 'Aumentar quantidade de Camiseta' }),
    ).toBeDisabled()
  })

  it('se o preço falhar, permite esvaziar a sacola', async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: 'p1', size: 'M', color: 'Preto', qty: 1 }]),
    )
    priceCartAction.mockRejectedValue(new Error('falhou'))
    renderCart()

    await userEvent.click(screen.getByRole('button', { name: /abrir sacola/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Esvaziar sacola' }))

    await waitFor(() => expect(localStorage.getItem(CART_STORAGE_KEY)).toBe('[]'))
    expect(screen.getByText('Sua sacola está vazia.')).toBeInTheDocument()
  })

  it('dois cliques rápidos em + somam dois', async () => {
    // Primeira precificação responde; as seguintes ficam pendentes (servidor lento).
    priceCartAction.mockResolvedValueOnce(priced(1)).mockImplementation(() => new Promise(() => {}))
    renderCart()
    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }))
    const plus = await screen.findByRole('button', { name: /Aumentar quantidade/ })
    await userEvent.click(plus)
    await userEvent.click(plus)
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')[0].qty).toBe(3),
    )
  })

  it('carrinho vazio mostra mensagem e não oferece checkout', async () => {
    renderCart()
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /abrir sacola/i }))
    })
    expect(screen.getByText('Sua sacola está vazia.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Finalizar compra' })).not.toBeInTheDocument()
  })
})
