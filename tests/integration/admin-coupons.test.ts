import { beforeEach, describe, expect, it } from 'vitest'
import { createCoupon, getCouponRule, listCoupons, updateCoupon } from '@/server/db/coupons'
import { db } from '@/server/db/firebase-admin'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

const coupon = {
  type: 'percent' as const,
  value: 10,
  minSubtotalCents: null,
  startsAt: null,
  endsAt: null,
  maxUses: 5,
  active: true,
}

describe('cupons', () => {
  it('cria com uso zerado e recusa código repetido', async () => {
    expect(await createCoupon('BEMVINDO', coupon)).toEqual({ ok: true, data: null })
    expect(await createCoupon('BEMVINDO', coupon)).toMatchObject({ code: 'coupon_exists' })
    expect(await getCouponRule('bemvindo')).toMatchObject({ code: 'BEMVINDO', usedCount: 0 })
  })

  it('editar não zera o uso nem muda tipo e valor', async () => {
    await createCoupon('BEMVINDO', coupon)
    await db().doc('coupons/BEMVINDO').update({ usedCount: 3 })
    await updateCoupon('BEMVINDO', {
      minSubtotalCents: 5000,
      startsAt: null,
      endsAt: new Date('2026-12-01T03:00:00Z'),
      maxUses: 10,
      active: false,
    })
    expect(await getCouponRule('BEMVINDO')).toMatchObject({
      type: 'percent',
      value: 10,
      usedCount: 3,
      maxUses: 10,
      active: false,
      minSubtotalCents: 5000,
    })
  })

  it('lista por código e editar inexistente dá not_found', async () => {
    await createCoupon('ZETA', coupon)
    await createCoupon('ALFA', coupon)
    expect((await listCoupons()).map((c) => c.code)).toEqual(['ALFA', 'ZETA'])
    expect(
      await updateCoupon('NADA', {
        minSubtotalCents: null,
        startsAt: null,
        endsAt: null,
        maxUses: null,
        active: true,
      }),
    ).toMatchObject({ code: 'not_found' })
  })
})
