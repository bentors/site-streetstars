import 'server-only'
import type { OrderStatus } from '@/lib/order-status'
import { canTransition } from './order-status'

/** O admin não marca pago nem expirado: isso vem do webhook e do cron. */
const ADMIN_TARGETS: readonly OrderStatus[] = [
  'in_production',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

export function adminTargets(from: OrderStatus): OrderStatus[] {
  return ADMIN_TARGETS.filter((to) => canTransition(from, to))
}

export function trackingUrl(code: string): string {
  return `https://melhorrastreio.com.br/rastreio/${encodeURIComponent(code)}`
}
