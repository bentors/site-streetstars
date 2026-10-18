'use client'

import { signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, TextField } from '@/components/ui'
import { signInAction } from '@/features/auth/actions'
import { authErrorCode, authErrorMessage } from '@/features/auth/error-messages'
import { passwordProblem } from '@/lib/account'
import { clientAuth } from '@/lib/firebase-client'

type Errors = Partial<Record<'current' | 'next' | 'confirm', string>>
const WRONG = ['auth/invalid-credential', 'auth/wrong-password']

export function ChangePasswordForm({ email }: { email: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    const found: Errors = {}
    const weak = passwordProblem(next)
    if (weak) found.next = weak
    else if (next === current) found.next = 'Escolha uma senha diferente da atual.'
    if (confirm !== next) found.confirm = 'As senhas não conferem.'
    if (!current) found.current = 'Obrigatório'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setPending(true)
    const auth = clientAuth()
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, current)
      await updatePassword(user, next)
      // A troca revoga os tokens antigos: o cookie precisa nascer do token novo.
      const session = await signInAction(await user.getIdToken(true))
      await signOut(auth)
      if (!session.ok) {
        router.replace('/entrar?next=/conta/seguranca')
        return
      }
      setCurrent('')
      setNext('')
      setConfirm('')
      setStatus({ ok: true, text: 'Senha alterada.' })
      router.refresh()
    } catch (err) {
      const code = authErrorCode(err)
      setStatus({
        ok: false,
        text: WRONG.includes(code)
          ? 'Senha atual incorreta.'
          : (authErrorMessage(code, 'Não foi possível trocar a senha. Tente de novo.') ?? ''),
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-sm flex-col gap-5">
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        value={current}
        error={errors.current}
        onValue={setCurrent}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        value={next}
        error={errors.next}
        onValue={setNext}
      />
      <TextField
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        value={confirm}
        error={errors.confirm}
        onValue={setConfirm}
      />
      {status ? (
        <p role="status" className={status.ok ? 'text-xs text-success' : 'text-xs text-danger'}>
          {status.text}
        </p>
      ) : null}
      <Button type="submit" loading={pending} className="self-start">
        Trocar senha
      </Button>
    </form>
  )
}
