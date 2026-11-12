import Link from 'next/link'
import { formatCep } from '@/lib/cep'
import { ORDER_STATUS_LABELS } from '@/lib/order-status'
import type { Order } from '@/server/db/orders'
import { OrderSummary } from './order-summary'
import { PendingPaymentWatcher } from './pending-payment-watcher'
import { RetryPaymentButton } from './retry-payment-button'

export type OrderViewData = Pick<
  Order,
  | 'number'
  | 'status'
  | 'items'
  | 'totals'
  | 'shipping'
  | 'shippingAddress'
  | 'tracking'
  | 'coupon'
  | 'payment'
>

const PROCESSING = ['pending', 'in_process', 'authorized', 'approved']

export function paymentState(
  order: Pick<OrderViewData, 'status' | 'payment'>,
  payable: boolean,
  returnStatus: string | null,
): 'processing' | 'rejected' | 'payable' | 'closed' {
  if (order.status !== 'pending_payment' || !payable) return 'closed'
  // A URL do retorno só vale enquanto o webhook não registrou nada: depois, o servidor manda.
  const status = order.payment.status ?? returnStatus
  if (PROCESSING.includes(status ?? '')) return 'processing'
  if (status === 'rejected' || status === 'cancelled') return 'rejected'
  return 'payable'
}

function statusMessage(order: OrderViewData, payable: boolean): string {
  const days = order.shipping.productionDays + order.shipping.deliveryDays
  switch (order.status) {
    case 'pending_payment':
      return payable
        ? 'Assim que o Mercado Pago confirmar o pagamento, esta página atualiza sozinha. Se você saiu antes de pagar, use o botão abaixo.'
        : 'O prazo de 48 horas para pagar este pedido acabou. Se você já pagou, fale com a gente.'
    case 'expired':
      return 'O prazo de 48 horas para pagar este pedido acabou. Se você já pagou, fale com a gente.'
    case 'paid':
      return `Pagamento confirmado! Seu pedido entra em produção em breve. Prazo estimado: até ${days} dias úteis.`
    case 'in_production':
      return `Seu pedido está sendo produzido. Prazo estimado: até ${days} dias úteis desde a compra.`
    case 'shipped':
      return 'Seu pedido foi enviado. Acompanhe pelo código de rastreio.'
    case 'delivered':
      return 'Pedido entregue. Obrigado por vestir Street Stars!'
    case 'cancelled':
      return 'Este pedido foi cancelado.'
    case 'refunded':
      return 'O valor deste pedido foi estornado.'
  }
}

export function OrderView({
  order,
  token,
  payable,
  helpUrl,
  returnStatus,
}: {
  order: OrderViewData
  token: string
  payable: boolean
  helpUrl: string | null
  /** `status` que o Mercado Pago anexa à back_url. */
  returnStatus: string | null
}) {
  const state = paymentState(order, payable, returnStatus)
  const title =
    order.status === 'pending_payment' && !payable
      ? ORDER_STATUS_LABELS.expired
      : ORDER_STATUS_LABELS[order.status]
  const address = order.shippingAddress

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
          Pedido {order.number}
        </p>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">{title}</h1>
        <p className="text-sm text-muted">{statusMessage(order, payable)}</p>
      </header>

      {state === 'processing' ? (
        <>
          <PendingPaymentWatcher />
          <p role="status" className="border border-info/30 bg-info/5 p-4 text-xs text-info">
            Recebemos seu pagamento e estamos aguardando a confirmação do Mercado Pago. Esta página
            atualiza sozinha; não precisa pagar de novo.
          </p>
        </>
      ) : null}
      {state === 'rejected' ? (
        <p role="alert" className="border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          O último pagamento não foi aprovado. Você pode tentar de novo, com outro cartão ou com
          Pix.
        </p>
      ) : null}
      {state === 'payable' || state === 'rejected' ? (
        <>
          <PendingPaymentWatcher />
          <RetryPaymentButton token={token} />
        </>
      ) : null}

      {order.tracking ? (
        <section className="flex flex-col gap-2 border border-line p-6 text-xs">
          <h2 className="font-black tracking-widest uppercase">Rastreio</h2>
          <p className="text-muted">{order.tracking.carrier}</p>
          <p className="font-mono text-sm">{order.tracking.code}</p>
          {order.tracking.url ? (
            <a
              href={order.tracking.url}
              target="_blank"
              rel="noreferrer"
              className="self-start underline hover:text-paper"
            >
              Rastrear entrega
            </a>
          ) : null}
        </section>
      ) : null}

      <OrderSummary
        items={order.items}
        subtotalCents={order.totals.subtotalCents}
        discountCents={order.totals.discountCents}
        couponCode={order.coupon?.code ?? null}
        shippingCents={order.totals.shippingCents}
      />

      <section className="flex flex-col gap-2 text-xs text-muted">
        <h2 className="font-black tracking-widest text-paper uppercase">Entrega</h2>
        <p>
          {address.street}, {address.number}
          {address.complement ? ` — ${address.complement}` : ''}
        </p>
        <p>
          {address.neighborhood} · {address.city}/{address.state} · CEP {formatCep(address.cep)}
        </p>
        <p>
          {order.shipping.name}
          {order.shipping.company ? ` (${order.shipping.company})` : ''}
        </p>
      </section>

      <div className="flex flex-wrap gap-6 text-[10px] tracking-widest uppercase">
        {helpUrl ? (
          <a href={helpUrl} target="_blank" rel="noreferrer" className="underline hover:text-paper">
            Dúvidas? Fale com a gente no WhatsApp
          </a>
        ) : null}
        <Link href="/#shop" className="text-muted hover:text-paper">
          Continuar comprando
        </Link>
      </div>
    </div>
  )
}
