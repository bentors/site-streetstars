import type { Metadata } from 'next'
import { Button, Input, Select } from '@/components/ui'
import { OrderTable } from '@/features/admin/order-table'
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from '@/lib/order-status'
import { requireAdmin } from '@/server/auth/session'
import { listAdminOrders } from '@/server/db/orders'

export const metadata: Metadata = { title: 'Pedidos' }

const isStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value)

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[] }>
}) {
  await requireAdmin()
  const params = await searchParams
  const status = isStatus(params.status) ? params.status : null
  const search = typeof params.q === 'string' ? params.q : ''
  const orders = await listAdminOrders({ status, search })

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-wrap items-end gap-3" action="/admin/pedidos">
        <Select name="status" defaultValue={status ?? ''} aria-label="Status" className="w-auto">
          <option value="">Todos os status</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
        <Input
          name="q"
          defaultValue={search}
          placeholder="Número (1042) ou e-mail"
          aria-label="Buscar"
          className="w-64"
        />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>
      <OrderTable
        orders={orders.map((order) => ({
          id: order.id,
          number: order.number,
          createdAt: order.createdAt,
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          status: order.status,
          totalCents: order.totals.totalCents,
          unseen: order.status === 'paid' && !order.adminSeenAt,
        }))}
      />
    </div>
  )
}
