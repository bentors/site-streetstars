import Link from 'next/link'
import { Badge } from '@/components/ui'
import { formatBRL } from '@/lib/money'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/order-status'

export type OrderRow = {
  id: string
  number: string
  status: OrderStatus
  totalCents: number
  itemCount: number
  createdAt: Date
  href: string
}

const date = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

const tone: Record<OrderStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending_payment: 'warning',
  paid: 'info',
  in_production: 'info',
  shipped: 'success',
  delivered: 'success',
  expired: 'neutral',
  cancelled: 'neutral',
  refunded: 'danger',
}

export function OrderList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 border border-line p-8">
        <p className="text-xs tracking-widest text-muted uppercase">Você ainda não fez pedidos.</p>
        <Link href="/#shop" className="text-xs tracking-widest uppercase underline">
          Ver produtos
        </Link>
      </div>
    )
  }
  return (
    <ul className="flex flex-col divide-y divide-line border border-line">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={order.href}
            className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-surface"
          >
            <span className="flex flex-col gap-1">
              <span className="text-sm font-black tracking-widest uppercase italic">
                {order.number}
              </span>
              <span className="font-mono text-[10px] text-muted">
                {date.format(order.createdAt)} · {order.itemCount}{' '}
                {order.itemCount === 1 ? 'item' : 'itens'}
              </span>
            </span>
            <span className="flex items-center gap-4">
              <Badge tone={tone[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
              <span className="font-mono text-sm">{formatBRL(order.totalCents)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
