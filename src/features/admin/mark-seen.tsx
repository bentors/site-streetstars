'use client'

import { useEffect } from 'react'
import { markOrderSeenAction } from './order-actions'

/** Abrir o pedido pago tira o "Novo" da lista (efeito, não render: prefetch não conta como visto). */
export function MarkSeen({ orderId }: { orderId: string }) {
  useEffect(() => {
    void markOrderSeenAction(orderId)
  }, [orderId])
  return null
}
