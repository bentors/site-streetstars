import 'server-only'
import { z } from 'zod'
import type { CouponUpdate } from '@/lib/admin-coupon'
import { fail, ok, type Result } from '@/lib/result'
import { isCouponCode, normalizeCouponCode, type CouponRule } from '@/server/domain/coupons'
import { parseDoc, timestampsToDates } from './convert'
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

export type CouponDoc = z.infer<typeof couponSchema>
export type CouponRow = CouponDoc & { code: string }

const coupons = () => db().collection('coupons')

export async function listCoupons(): Promise<CouponRow[]> {
  const snapshot = await coupons().get()
  return snapshot.docs
    .flatMap((doc) => {
      const data = parseDoc(couponSchema, doc.ref.path, doc.data())
      return data ? [{ code: doc.id, ...data }] : []
    })
    .sort((a, b) => a.code.localeCompare(b.code))
}

export async function createCoupon(
  code: string,
  input: Omit<CouponDoc, 'usedCount'>,
): Promise<Result<null>> {
  const doc = couponSchema.parse({ ...input, usedCount: 0 })
  try {
    await coupons().doc(code).create(doc)
    return ok(null)
  } catch (error) {
    // 6 = ALREADY_EXISTS no gRPC do Firestore.
    if ((error as { code?: number }).code === 6) {
      return fail('coupon_exists', 'Já existe um cupom com esse código.')
    }
    throw error
  }
}

/** Só validade, limite, mínimo e ativo: tipo, valor e usos ficam como estão. */
export async function updateCoupon(code: string, patch: CouponUpdate): Promise<Result<null>> {
  const ref = coupons().doc(code)
  return db().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref)
    if (!snapshot.exists) return fail('not_found', 'Cupom não encontrado.')
    const current = couponSchema.parse(timestampsToDates(snapshot.data()))
    tx.set(ref, couponSchema.parse({ ...current, ...patch }))
    return ok(null)
  })
}
