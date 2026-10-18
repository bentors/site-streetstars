'use client'

import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type UserCredential,
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Field, Input } from '@/components/ui'
import { clientAuth } from '@/lib/firebase-client'
import { signInAction } from './actions'
import { authErrorCode, authErrorMessage } from './error-messages'

type Pending = 'password' | 'google' | null

export function SignInForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)

  async function run(kind: Exclude<Pending, null>, signIn: () => Promise<UserCredential>) {
    setError(null)
    setPending(kind)
    try {
      const credential = await signIn()
      const result = await signInAction(await credential.user.getIdToken())
      await signOut(clientAuth())
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.replace(next)
      router.refresh()
    } catch (err) {
      const message = authErrorMessage(authErrorCode(err))
      if (message) setError(message)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          void run('password', () =>
            signInWithEmailAndPassword(clientAuth(), email.trim(), password),
          )
        }}
      >
        <Field label="E-mail">
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>
        <Field label="Senha">
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        {error ? (
          <p
            role="alert"
            className="border border-danger/20 bg-danger/10 p-3 text-center text-xs text-danger"
          >
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          loading={pending === 'password'}
          disabled={pending !== null}
        >
          Entrar
        </Button>
      </form>

      <div className="flex items-center gap-3 text-[10px] tracking-widest text-muted uppercase">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="secondary"
        size="lg"
        loading={pending === 'google'}
        disabled={pending !== null}
        onClick={() =>
          void run('google', () => signInWithPopup(clientAuth(), new GoogleAuthProvider()))
        }
      >
        Entrar com Google
      </Button>
    </div>
  )
}
