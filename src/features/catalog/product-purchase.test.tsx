import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cart = vi.hoisted(() => ({ add: vi.fn() }))
vi.mock('@/features/cart/cart-context', () => ({ useCart: () => cart }))

import { ProductPurchase } from './product-purchase'

const tee = {
  id: 'p1',
  name: 'Camiseta',
  sizes: ['P', 'M'],
  colors: [
    { name: 'Preto', hex: '#000000', image: 'https://img/preto.jpg' },
    { name: 'Branco', hex: '#ffffff', image: null },
  ],
  sizeGuide: { columns: ['Tam', 'Largura'], rows: [{ size: 'P', values: ['55'] }] },
}

beforeEach(() => vi.clearAllMocks())

describe('ProductPurchase', () => {
  it('exige cor e tamanho antes de adicionar', async () => {
    const onColorChange = vi.fn()
    render(<ProductPurchase product={tee} onColorChange={onColorChange} />)
    const add = screen.getByRole('button', { name: 'Selecione uma cor' })
    expect(add).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Cor Preto' }))
    expect(onColorChange).toHaveBeenCalledWith('https://img/preto.jpg')
    expect(screen.getByRole('button', { name: 'Selecione um tamanho' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Tamanho M' }))
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à sacola' }))
    expect(cart.add).toHaveBeenCalledWith({ productId: 'p1', size: 'M', color: 'Preto' })
  })

  it('produto sem cores e tamanho único adiciona com color null', async () => {
    render(<ProductPurchase product={{ ...tee, sizes: ['UN'], colors: [], sizeGuide: null }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tamanho UN' }))
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à sacola' }))
    expect(cart.add).toHaveBeenCalledWith({ productId: 'p1', size: 'UN', color: null })
    expect(screen.queryByRole('button', { name: 'Guia de medidas' })).not.toBeInTheDocument()
  })

  it('abre o guia de medidas', async () => {
    render(<ProductPurchase product={tee} />)
    await userEvent.click(screen.getByRole('button', { name: 'Guia de medidas' }))
    expect(screen.getByRole('dialog', { name: 'Guia de medidas' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '55' })).toBeInTheDocument()
  })
})
