import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdmin = vi.hoisted(() => vi.fn())
const repo = vi.hoisted(() => ({ createCoupon: vi.fn(), updateCoupon: vi.fn() }))
vi.mock('@/server/auth/session', () => ({ requireAdmin }))
vi.mock('@/server/db/coupons', () => repo)

import { couponToForm } from '@/lib/admin-coupon'
import { createCouponAction, updateCouponAction } from './coupon-actions'

const form = { ...couponToForm(null), code: 'bemvindo', value: '10' }

beforeEach(() => {
  vi.resetAllMocks()
  requireAdmin.mockResolvedValue({ uid: 'admin' })
  repo.createCoupon.mockResolvedValue({ ok: true, data: null })
  repo.updateCoupon.mockResolvedValue({ ok: true, data: null })
})

describe('coupon actions', () => {
  it('quem não é admin não grava', async () => {
    requireAdmin.mockRejectedValue(new Error('NOT_FOUND'))
    await expect(createCouponAction(form)).rejects.toThrow()
    expect(repo.createCoupon).not.toHaveBeenCalled()
  })

  it('cria com código normalizado', async () => {
    await createCouponAction(form)
    expect(repo.createCoupon).toHaveBeenCalledWith(
      'BEMVINDO',
      expect.objectContaining({ type: 'percent', value: 10, active: true }),
    )
  })

  it('editar manda só o que pode mudar', async () => {
    await updateCouponAction('BEMVINDO', { ...form, type: 'fixed', value: '999', maxUses: '3' })
    expect(repo.updateCoupon).toHaveBeenCalledWith('BEMVINDO', {
      minSubtotalCents: null,
      startsAt: null,
      endsAt: null,
      maxUses: 3,
      active: true,
    })
  })

  it('código inválido na edição é recusado', async () => {
    expect(await updateCouponAction('a/b', form)).toMatchObject({ code: 'invalid_input' })
  })
})
