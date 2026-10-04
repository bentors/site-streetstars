export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'in_production',
  'shipped',
  'delivered',
  'expired',
  'cancelled',
  'refunded',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Aguardando pagamento',
  paid: 'Pagamento confirmado',
  in_production: 'Em produção',
  shipped: 'Enviado',
  delivered: 'Entregue',
  expired: 'Prazo de pagamento encerrado',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
}

const PAID: readonly OrderStatus[] = ['paid', 'in_production', 'shipped', 'delivered']

export function isPaidStatus(status: OrderStatus): boolean {
  return PAID.includes(status)
}
