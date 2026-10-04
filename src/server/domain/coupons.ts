import 'server-only'
import { formatBRL } from '@/lib/money'
import { fail, ok, type Result } from '@/lib/result'

export type CouponType = 'percent' | 'fixed'

export type CouponRule = {
  code: string
  type: CouponType
  /** Percentual (1–100) ou centavos, conforme `type`. */
  value: number
  minSubtotalCents: number | null
  startsAt: Date | null
  endsAt: Date | null
  maxUses: number | null
  usedCount: number
  active: boolean
}

export type AppliedCoupon = { code: string; type: CouponType; value: number; discountCents: number }

// O código é o id do documento em coupons/: sem '/', espaços ou caracteres estranhos.
const COUPON_CODE = /^[A-Z0-9_-]{1,32}$/

export function normalizeCouponCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isCouponCode(code: string): boolean {
  return COUPON_CODE.test(code)
}

export function applyCoupon(
  coupon: CouponRule | null,
  subtotalCents: number,
  now: Date,
): Result<AppliedCoupon> {
  if (!coupon || !coupon.active) return fail('coupon_invalid', 'Cupom inválido.')
  if (coupon.startsAt && now < coupon.startsAt) {
    return fail('coupon_not_started', 'Este cupom ainda não está valendo.')
  }
  if (coupon.endsAt && now > coupon.endsAt) return fail('coupon_expired', 'Este cupom expirou.')
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return fail('coupon_exhausted', 'Este cupom esgotou.')
  }
  if (coupon.minSubtotalCents !== null && subtotalCents < coupon.minSubtotalCents) {
    return fail(
      'coupon_min_subtotal',
      `Este cupom vale para compras a partir de ${formatBRL(coupon.minSubtotalCents)}.`,
    )
  }

  const discountCents =
    coupon.type === 'percent'
      ? Math.floor((subtotalCents * coupon.value) / 100)
      : Math.min(coupon.value, subtotalCents)
  return ok({ code: coupon.code, type: coupon.type, value: coupon.value, discountCents })
}
