'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const INTERVAL_MS = 5000
const MAX_MS = 10 * 60 * 1000

/** Enquanto o pagamento não confirma, relê a página no servidor a cada 5 s (por até 10 min). */
export function PendingPaymentWatcher() {
  const router = useRouter()
  useEffect(() => {
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      if (Date.now() - startedAt > MAX_MS) {
        window.clearInterval(id)
        return
      }
      router.refresh()
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [router])
  return null
}
