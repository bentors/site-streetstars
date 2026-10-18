import 'server-only'
import type { OrderStatus } from '@/lib/order-status'

// Máquina de status da spec (seção 3). Status nunca regridem.
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['paid', 'expired', 'cancelled'],
  expired: ['paid'],
  paid: ['in_production', 'cancelled', 'refunded'],
  in_production: ['shipped', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  // Cancelado depois de pago e estornado no painel do MP: o webhook do estorno fecha o pedido.
  cancelled: ['refunded'],
  refunded: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}
