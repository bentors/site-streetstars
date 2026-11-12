'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Checkbox, TextField } from '@/components/ui'
import { profileSchema } from '@/lib/account'
import { formatCpf } from '@/lib/cpf'
import { fieldErrors } from '@/lib/form-errors'
import { formatPhone } from '@/lib/phone'
import { updateProfileAction } from './actions'
import { attempt } from '@/lib/attempt'

type Values = { name: string; phone: string; cpf: string; marketingConsent: boolean }

export function ProfileForm({ initial }: { initial: Values }) {
  const router = useRouter()
  const [values, setValues] = useState<Values>({
    ...initial,
    phone: formatPhone(initial.phone),
    cpf: formatCpf(initial.cpf),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const set = (patch: Partial<Values>) => setValues((current) => ({ ...current, ...patch }))

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    const parsed = profileSchema.safeParse(values)
    setErrors(parsed.success ? {} : fieldErrors(parsed.error))
    if (!parsed.success) return
    start(async () => {
      const result = await attempt(() => updateProfileAction(values))
      setStatus(
        result.ok ? { ok: true, text: 'Dados salvos.' } : { ok: false, text: result.message },
      )
      if (result.ok) router.refresh()
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-5">
      <TextField
        label="Nome completo"
        autoComplete="name"
        value={values.name}
        error={errors.name}
        onValue={(name) => set({ name })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Telefone"
          type="tel"
          autoComplete="tel-national"
          value={values.phone}
          error={errors.phone}
          onValue={(phone) => set({ phone: formatPhone(phone) })}
        />
        <TextField
          label="CPF"
          inputMode="numeric"
          value={values.cpf}
          error={errors.cpf}
          onValue={(cpf) => set({ cpf: formatCpf(cpf) })}
        />
      </div>
      <Checkbox
        checked={values.marketingConsent}
        onChange={(event) => set({ marketingConsent: event.target.checked })}
        label="Quero receber novidades e lançamentos por e-mail."
      />
      {status ? (
        <p role="status" className={status.ok ? 'text-xs text-success' : 'text-xs text-danger'}>
          {status.text}
        </p>
      ) : null}
      <Button type="submit" loading={pending} className="self-start">
        Salvar
      </Button>
    </form>
  )
}
