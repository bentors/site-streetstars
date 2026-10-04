import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OrderView } from '@/features/orders/order-view'
import { whatsappUrl } from '@/lib/store-settings'
import { getCachedStoreSettings } from '@/server/catalog'
import { getOrderByToken, isPayable } from '@/server/orders/access'

// Sempre lido do servidor: o status muda com o webhook.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Seu pedido', robots: { index: false, follow: false } }

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const order = await getOrderByToken(token)
  if (!order) notFound()

  const settings = await getCachedStoreSettings()
  return (
    <div className="pt-28 pb-20">
      <OrderView
        order={order}
        token={token}
        payable={isPayable(order)}
        helpUrl={whatsappUrl(
          settings.whatsapp,
          `Olá! Tenho uma dúvida sobre o pedido ${order.number}.`,
        )}
      />
    </div>
  )
}
