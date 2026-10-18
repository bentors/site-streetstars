import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, CopyButton } from '@/components/ui'
import { MarkSeen } from '@/features/admin/mark-seen'
import { OrderStatusActions } from '@/features/admin/order-status-actions'
import { OrderSummary } from '@/features/orders/order-summary'
import { formatCep } from '@/lib/cep'
import { formatCpf } from '@/lib/cpf'
import { formatDateTime } from '@/lib/format-date'
import { formatBRL } from '@/lib/money'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/lib/order-status'
import { formatPhone } from '@/lib/phone'
import { requireAdmin } from '@/server/auth/session'
import { getOrder } from '@/server/db/orders'
import { adminTargets } from '@/server/domain/admin-order'

export const metadata: Metadata = { title: 'Pedido' }

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border border-line p-5 text-xs">
      <h2 className="font-black tracking-widest uppercase">{title}</h2>
      {children}
    </section>
  )
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  const { customer, shippingAddress: a, payment } = order
  const addressText = [
    customer.name,
    `${a.street}, ${a.number}${a.complement ? ` — ${a.complement}` : ''}`,
    `${a.neighborhood} · ${a.city}/${a.state}`,
    `CEP ${formatCep(a.cep)}`,
  ].join('\n')

  return (
    <div className="flex flex-col gap-6">
      {order.status === 'paid' && !order.adminSeenAt ? <MarkSeen orderId={order.id} /> : null}
      <Link href="/admin/pedidos" className="text-[10px] tracking-widest text-muted uppercase">
        ← Pedidos
      </Link>
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-black tracking-tighter uppercase italic">{order.number}</h1>
        <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
        <span className="font-mono text-[10px] text-muted">{formatDateTime(order.createdAt)}</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <OrderStatusActions
            orderId={order.id}
            targets={adminTargets(order.status)}
            shippedEmailPending={
              (order.status === 'shipped' || order.status === 'delivered') &&
              order.tracking !== null &&
              !order.notifications.shippedSentAt
            }
          />
          <OrderSummary
            items={order.items}
            subtotalCents={order.totals.subtotalCents}
            discountCents={order.totals.discountCents}
            couponCode={order.coupon?.code ?? null}
            shippingCents={order.totals.shippingCents}
          />
          <Block title="Histórico">
            <ol className="flex flex-col gap-2">
              {order.statusHistory.map((entry, index) => (
                <li key={index} className="flex flex-col">
                  <span>
                    <strong>{ORDER_STATUS_LABELS[entry.status]}</strong> ·{' '}
                    <span className="font-mono text-muted">{formatDateTime(entry.at)}</span> ·{' '}
                    <span className="text-muted">{entry.by}</span>
                  </span>
                  {entry.note ? <span className="text-muted">{entry.note}</span> : null}
                </li>
              ))}
            </ol>
          </Block>
        </div>

        <aside className="flex flex-col gap-6">
          <Block title="Cliente">
            <p>{customer.name}</p>
            <p className="font-mono">{customer.email}</p>
            <p className="font-mono">{formatPhone(customer.phone)}</p>
            <p className="font-mono">CPF {formatCpf(customer.cpf)}</p>
            <p className="text-muted">{customer.uid ? 'Com conta' : 'Compra sem conta'}</p>
          </Block>
          <Block title="Entrega">
            <p className="whitespace-pre-line">{addressText}</p>
            <p className="text-muted">
              {order.shipping.name} ({order.shipping.company}) ·{' '}
              {formatBRL(order.shipping.priceCents)} · {order.shipping.productionDays} +{' '}
              {order.shipping.deliveryDays} dias úteis
            </p>
            <CopyButton text={addressText} label="Copiar endereço" />
          </Block>
          {order.tracking ? (
            <Block title="Rastreio">
              <p className="font-mono">{order.tracking.code}</p>
              {order.tracking.url ? (
                <a href={order.tracking.url} target="_blank" rel="noreferrer" className="underline">
                  Abrir rastreio
                </a>
              ) : null}
            </Block>
          ) : null}
          <Block title="Pagamento">
            <p>Status no MP: {payment.status ?? '—'}</p>
            <p>Meio: {payment.method ?? '—'}</p>
            <p>
              Valor pago:{' '}
              {payment.paidAmountCents === null ? '—' : formatBRL(payment.paidAmountCents)}
            </p>
            <p>Pago em: {payment.paidAt ? formatDateTime(payment.paidAt) : '—'}</p>
            <p className="font-mono text-muted">Pagamento: {payment.paymentId ?? '—'}</p>
          </Block>
        </aside>
      </div>
    </div>
  )
}
