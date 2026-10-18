'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui'
import { confirmEmailAction } from './actions'
import { attempt } from '@/lib/attempt'

export function VerifyEmailNotice({ email }: { email: string | null }) {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <div className="flex flex-col gap-3 border border-warning/30 bg-warning/5 p-4 text-xs text-warning sm:flex-row sm:items-center sm:justify-between">
      <p>
        Confirme seu e-mail{email ? ` (${email})` : ''} pelo link que enviamos. Assim, pedidos
        feitos sem login com esse e-mail aparecem aqui.
        {message ? <span className="mt-1 block text-danger">{message}</span> : null}
      </p>
      <Button
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() =>
          start(async () => {
            const result = await attempt(() => confirmEmailAction())
            if (!result.ok) setMessage(result.message)
          })
        }
      >
        Já confirmei
      </Button>
    </div>
  )
}
