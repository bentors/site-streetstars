import type { Metadata } from 'next'
import { OrderList } from '@/features/account/order-list'
import { requireUser } from '@/server/auth/session'
import { listUserOrders } from '@/server/db/orders'
import { orderPath } from '@/server/orders/access'

export const metadata: Metadata = { title: 'Pedidos' }

export default async function AccountOrdersPage() {
  const user = await requireUser('/conta')
  const orders = await listUserOrders(user.uid)
  return (
    <OrderList
      orders={orders.map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        totalCents: order.totals.totalCents,
        itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
        createdAt: order.createdAt,
        href: orderPath(order.id),
      }))}
    />
  )
}
