import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
const actions = vi.hoisted(() => ({ createCouponAction: vi.fn(), updateCouponAction: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./coupon-actions', () => actions)

import { CouponManager } from './coupon-manager'

const row = {
  code: 'BEMVINDO',
  type: 'percent' as const,
  value: 10,
  minSubtotalCents: null,
  startsAt: null,
  endsAt: null,
  maxUses: 5,
  usedCount: 3,
  active: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  actions.createCouponAction.mockResolvedValue({ ok: true, data: null })
  actions.updateCouponAction.mockResolvedValue({ ok: true, data: null })
})

describe('CouponManager', () => {
  it('lista com uso e desconto', () => {
    render(<CouponManager coupons={[row]} />)
    const item = screen.getByRole('listitem')
    expect(within(item).getByText('BEMVINDO')).toBeInTheDocument()
    expect(within(item).getByText('10%')).toBeInTheDocument()
    expect(within(item).getByText('3 / 5 usos')).toBeInTheDocument()
  })

  it('cria um cupom', async () => {
    render(<CouponManager coupons={[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Novo cupom' }))
    await userEvent.type(screen.getByLabelText('Código'), 'natal')
    await userEvent.type(screen.getByLabelText('Desconto (%)'), '15')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar cupom' }))
    expect(actions.createCouponAction).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'natal', value: '15' }),
    )
    expect(router.refresh).toHaveBeenCalled()
  })

  it('na edição, código, tipo e valor ficam travados', async () => {
    render(<CouponManager coupons={[row]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(screen.getByLabelText('Código')).toBeDisabled()
    expect(screen.getByLabelText('Desconto (%)')).toBeDisabled()
    await userEvent.click(screen.getByLabelText('Ativo'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar cupom' }))
    expect(actions.updateCouponAction).toHaveBeenCalledWith(
      'BEMVINDO',
      expect.objectContaining({ active: false }),
    )
  })
})
