'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui'
import { redirectTo } from '@/lib/navigate'
import { retryPaymentAction } from './actions'

export function RetryPaymentButton({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function pay() {
    startTransition(async () => {
      try {
        const result = await retryPaymentAction(token)
        if (result.ok) {
          redirectTo(result.data.redirectUrl)
          return
        }
        setError(result.message)
      } catch {
        setError('Não foi possível abrir o pagamento agora. Tente de novo.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" loading={pending} onClick={pay}>
        Pagar agora
      </Button>
      {error ? (
        <p role="alert" className="font-mono text-[10px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
