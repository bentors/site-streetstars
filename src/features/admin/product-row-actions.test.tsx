import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
const actions = vi.hoisted(() => ({
  setProductStatusAction: vi.fn(),
  setProductFeaturedAction: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./catalog-actions', () => actions)

import { ProductRowActions } from './product-row-actions'

beforeEach(() => {
  vi.clearAllMocks()
  actions.setProductFeaturedAction.mockResolvedValue({ ok: true, data: null })
  actions.setProductStatusAction.mockResolvedValue({ ok: true, data: null })
})

describe('ProductRowActions', () => {
  it('sair do campo sem mudar a ordem não grava', async () => {
    render(
      <ProductRowActions
        id="p1"
        status="active"
        featured
        featuredOrder={2}
        nextFeaturedOrder={3}
      />,
    )
    await userEvent.click(screen.getByLabelText('Ordem do destaque'))
    await userEvent.tab()
    expect(actions.setProductFeaturedAction).not.toHaveBeenCalled()
  })

  it('ordem inválida avisa sem gravar', async () => {
    render(
      <ProductRowActions
        id="p1"
        status="active"
        featured
        featuredOrder={2}
        nextFeaturedOrder={3}
      />,
    )
    await userEvent.clear(screen.getByLabelText('Ordem do destaque'))
    await userEvent.tab()
    expect(screen.getByText('Ordem inválida')).toBeInTheDocument()
    expect(actions.setProductFeaturedAction).not.toHaveBeenCalled()
  })

  it('destacar usa a próxima posição livre', async () => {
    render(
      <ProductRowActions
        id="p1"
        status="active"
        featured={false}
        featuredOrder={null}
        nextFeaturedOrder={4}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Destacar' }))
    expect(actions.setProductFeaturedAction).toHaveBeenCalledWith('p1', true, 4)
  })
})
