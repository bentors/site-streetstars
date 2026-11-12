import type { Metadata } from 'next'
import { CouponManager } from '@/features/admin/coupon-manager'
import { requireAdmin } from '@/server/auth/session'
import { listCoupons } from '@/server/db/coupons'

export const metadata: Metadata = { title: 'Cupons' }

export default async function AdminCouponsPage() {
  await requireAdmin()
  return <CouponManager coupons={await listCoupons()} />
}
