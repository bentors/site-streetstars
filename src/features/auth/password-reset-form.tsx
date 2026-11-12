'use client'

import { sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react'
import { Button, TextField } from '@/components/ui'
import { clientAuth } from '@/lib/firebase-client'
import { authErrorCode, authErrorMessage } from './error-messages'

// Erros que o cliente consegue corrigir; o resto mostra a confirmação (não revela se a conta existe).
const SHOWN = ['auth/invalid-email', 'auth/network-request-failed', 'auth/too-many-requests']

export function PasswordResetForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await sendPasswordResetEmail(clientAuth(), email.trim(), {
        url: `${window.location.origin}/entrar`,
      })
      setSent(true)
    } catch (err) {
      const code = authErrorCode(err)
      if (SHOWN.includes(code)) setError(authErrorMessage(code))
      else setSent(true)
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <p role="status" className="text-xs leading-relaxed text-muted">
        Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha.
        Confira também o spam.
      </p>
    )
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        error={error ?? undefined}
        onValue={setEmail}
      />
      <Button type="submit" size="lg" loading={pending}>
        Enviar link
      </Button>
    </form>
  )
}
