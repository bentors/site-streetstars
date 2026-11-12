import 'server-only'
import { publicEnv } from '@/lib/env'
import { getOrder, type Order } from '@/server/db/orders'
import { createOrderToken, readOrderToken } from '@/server/domain/order-token'
import { serverEnv } from '@/server/env'

export function orderPath(orderId: string): string {
  return `/pedido/${createOrderToken(orderId, serverEnv().ORDER_TOKEN_SECRET)}`
}

export function orderUrl(orderId: string): string {
  return new URL(orderPath(orderId), publicEnv().NEXT_PUBLIC_SITE_URL).toString()
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const orderId = readOrderToken(token, serverEnv().ORDER_TOKEN_SECRET)
  return orderId ? getOrder(orderId) : null
}

/** Pendente e dentro das 48 h: pode gerar link de pagamento. */
export function isPayable(order: Pick<Order, 'status' | 'expiresAt'>, now = new Date()): boolean {
  return order.status === 'pending_payment' && order.expiresAt > now
}
