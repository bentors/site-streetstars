import Link from 'next/link'
import { Badge } from '@/components/ui'
import { formatDateTime } from '@/lib/format-date'
import { formatBRL } from '@/lib/money'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, type OrderStatus } from '@/lib/order-status'

export type AdminOrderRow = {
  id: string
  number: string
  createdAt: Date
  customerName: string
  customerEmail: string
  status: OrderStatus
  totalCents: number
  unseen: boolean
}

export function OrderTable({ orders }: { orders: AdminOrderRow[] }) {
  if (orders.length === 0) {
    return <p className="text-xs text-muted">Nenhum pedido encontrado.</p>
  }
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-line font-mono text-[10px] tracking-widest text-muted uppercase">
          <tr>
            <th className="p-3">Pedido</th>
            <th className="p-3">Data</th>
            <th className="p-3">Cliente</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="p-3 font-bold">
                <Link href={`/admin/pedidos/${order.id}`} className="underline">
                  {order.number}
                </Link>
                {order.unseen ? (
                  <span className="ml-2">
                    <Badge tone="warning">Novo</Badge>
                  </span>
                ) : null}
              </td>
              <td className="p-3 font-mono text-muted">{formatDateTime(order.createdAt)}</td>
              <td className="p-3">
                <span className="block">{order.customerName}</span>
                <span className="block font-mono text-[10px] text-muted">
                  {order.customerEmail}
                </span>
              </td>
              <td className="p-3">
                <Badge tone={ORDER_STATUS_TONES[order.status]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </td>
              <td className="p-3 text-right font-mono">{formatBRL(order.totalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
