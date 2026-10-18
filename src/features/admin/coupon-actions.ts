'use server'

import { couponFormSchema, couponUpdateSchema } from '@/lib/admin-coupon'
import { fail, type Result } from '@/lib/result'
import { requireAdmin } from '@/server/auth/session'
import { createCoupon, updateCoupon } from '@/server/db/coupons'

const first = (issues: { message: string }[]) =>
  fail('invalid_input', issues[0]?.message ?? 'Confira os dados.')

export async function createCouponAction(values: unknown): Promise<Result<null>> {
  await requireAdmin()
  const parsed = couponFormSchema.safeParse(values)
  if (!parsed.success) return first(parsed.error.issues)
  const { code, ...coupon } = parsed.data
  return createCoupon(code, coupon)
}

export async function updateCouponAction(code: string, values: unknown): Promise<Result<null>> {
  await requireAdmin()
  if (typeof code !== 'string' || !/^[A-Z0-9_-]{1,32}$/.test(code)) {
    return fail('invalid_input', 'Cupom inválido.')
  }
  const parsed = couponUpdateSchema.safeParse(values)
  if (!parsed.success) return first(parsed.error.issues)
  return updateCoupon(code, parsed.data)
}
