'use client'

import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Checkbox, TextField } from '@/components/ui'
import { passwordProblem, signUpSchema } from '@/lib/account'
import { clientAuth } from '@/lib/firebase-client'
import { fieldErrors } from '@/lib/form-errors'
import { signUpAction } from './actions'
import { authErrorCode, authErrorMessage } from './error-messages'

type Errors = Partial<Record<'name' | 'password' | 'acceptTerms', string>>

export function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const parsed = signUpSchema.safeParse({ name, marketingConsent, acceptTerms })
    const found: Errors = parsed.success ? {} : fieldErrors(parsed.error)
    const weak = passwordProblem(password)
    if (weak) found.password = weak
    setErrors(found)
    if (!parsed.success || weak) return

    setPending(true)
    try {
      const auth = clientAuth()
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
      // Sem a verificação o cliente só perde o vínculo de pedidos antigos: não bloqueia o cadastro.
      await sendEmailVerification(user, {
        url: `${window.location.origin}/entrar?next=/conta&confirmado=1`,
      }).catch(() => {})
      const result = await signUpAction(await user.getIdToken(), parsed.data)
      await signOut(auth)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.replace('/conta')
      router.refresh()
    } catch (err) {
      setError(
        authErrorMessage(authErrorCode(err), 'Não foi possível criar a conta. Tente de novo.'),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
      <TextField
        label="Nome"
        autoComplete="name"
        value={name}
        error={errors.name}
        onValue={setName}
      />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={email}
        onValue={setEmail}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        value={password}
        error={errors.password}
        onValue={setPassword}
      />
      <div className="flex flex-col gap-2">
        <Checkbox
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
          label={
            <>
              Li e aceito os{' '}
              <Link href="/legal/termos-de-uso" className="underline" target="_blank">
                termos de uso
              </Link>{' '}
              e a{' '}
              <Link href="/legal/politica-de-privacidade" className="underline" target="_blank">
                política de privacidade
              </Link>
              .
            </>
          }
        />
        {errors.acceptTerms ? (
          <p className="font-mono text-[10px] text-danger">{errors.acceptTerms}</p>
        ) : null}
      </div>
      <Checkbox
        checked={marketingConsent}
        onChange={(event) => setMarketingConsent(event.target.checked)}
        label="Quero receber novidades e lançamentos por e-mail."
      />
      {error ? (
        <p
          role="alert"
          className="border border-danger/20 bg-danger/10 p-3 text-center text-xs text-danger"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={pending}>
        Criar conta
      </Button>
    </form>
  )
}
