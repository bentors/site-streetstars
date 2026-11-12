import 'server-only'
import type { OrderStatus } from '@/lib/order-status'
import { canTransition } from './order-status'

export type PaymentEvent = { id: string; status: string; amountCents: number }

export type OrderPaymentState = {
  status: OrderStatus
  totalCents: number
  payment: { paymentId: string | null; status: string | null }
  /** Pagamentos que já geraram entrada no histórico (pago ou alerta). */
  handledPaymentIds: string[]
}

export type PaymentOutcome =
  | { kind: 'ignore' }
  /** Só atualiza payment.* (pedido continua aguardando). */
  | { kind: 'record' }
  | { kind: 'transition'; to: 'paid' | 'refunded' }
  /** Registra no histórico e avisa a loja; o status não muda. */
  | { kind: 'alert'; reason: 'amount_mismatch' | 'unexpected_payment' }

/** O pagamento vem da API do MP (fonte da verdade), não do corpo do webhook. */
export function decidePaymentOutcome(
  order: OrderPaymentState,
  payment: PaymentEvent,
): PaymentOutcome {
  if (order.payment.paymentId === payment.id && order.payment.status === payment.status) {
    return { kind: 'ignore' }
  }
  const waiting = order.status === 'pending_payment' || order.status === 'expired'

  switch (payment.status) {
    case 'approved':
      if (order.handledPaymentIds.includes(payment.id)) return { kind: 'ignore' }
      if (payment.amountCents !== order.totalCents) {
        return { kind: 'alert', reason: 'amount_mismatch' }
      }
      if (canTransition(order.status, 'paid')) return { kind: 'transition', to: 'paid' }
      // Pedido cancelado ou já pago por outro pagamento: dinheiro entrou sem pedido esperando.
      return { kind: 'alert', reason: 'unexpected_payment' }
    case 'refunded':
    case 'charged_back':
      return order.payment.paymentId === payment.id && canTransition(order.status, 'refunded')
        ? { kind: 'transition', to: 'refunded' }
        : { kind: 'ignore' }
    default:
      // rejected, cancelled, pending, in_process...: o cliente ainda pode tentar de novo.
      return waiting ? { kind: 'record' } : { kind: 'ignore' }
  }
}
