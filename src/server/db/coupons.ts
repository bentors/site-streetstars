import 'server-only'
import { z } from 'zod'
import { isCouponCode, normalizeCouponCode, type CouponRule } from '@/server/domain/coupons'
import { parseDoc } from './convert'
import { db } from './firebase-admin'

export const couponSchema = z
  .object({
    type: z.enum(['percent', 'fixed']),
    value: z.number().int().positive(),
    minSubtotalCents: z.number().int().min(0).nullable(),
    startsAt: z.date().nullable(),
    endsAt: z.date().nullable(),
    maxUses: z.number().int().positive().nullable(),
    usedCount: z.number().int().min(0),
    active: z.boolean(),
  })
  .refine((coupon) => coupon.type === 'fixed' || coupon.value <= 100, {
    message: 'percentual acima de 100',
  })

export async function getCouponRule(rawCode: string): Promise<CouponRule | null> {
  const code = normalizeCouponCode(rawCode)
  if (!isCouponCode(code)) return null
  const snapshot = await db().collection('coupons').doc(code).get()
  if (!snapshot.exists) return null
  const data = parseDoc(couponSchema, snapshot.ref.path, snapshot.data())
  return data ? { code, ...data } : null
}
