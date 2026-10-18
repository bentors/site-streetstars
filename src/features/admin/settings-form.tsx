'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, TextField } from '@/components/ui'
import { settingsFormSchema, type SettingsFormValues } from '@/lib/admin-settings'
import { fieldErrors } from '@/lib/form-errors'
import { updateSettingsAction } from './settings-actions'

const FIELDS: { key: keyof SettingsFormValues; label: string; hint?: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', hint: 'Com DDI e DDD, ex.: 55 11 98765-4321' },
  { key: 'email', label: 'E-mail da loja' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'address', label: 'Endereço (aparece nos termos)' },
  { key: 'originCep', label: 'CEP de origem do frete' },
  { key: 'heightCm', label: 'Pacote: altura (cm)' },
  { key: 'widthCm', label: 'Pacote: largura (cm)' },
  { key: 'lengthCm', label: 'Pacote: comprimento (cm)' },
]

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    const parsed = settingsFormSchema.safeParse(values)
    setErrors(parsed.success ? {} : fieldErrors(parsed.error))
    if (!parsed.success) return
    start(async () => {
      const result = await updateSettingsAction(values)
      setStatus(
        result.ok
          ? { ok: true, text: 'Configurações salvas.' }
          : { ok: false, text: result.message },
      )
      if (result.ok) router.refresh()
    })
  }

  return (
    <form onSubmit={submit} noValidate className="grid max-w-3xl gap-5 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <TextField
          key={field.key}
          label={field.label}
          placeholder={field.hint}
          value={values[field.key]}
          error={errors[field.key]}
          onValue={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
        />
      ))}
      {status ? (
        <p
          role="status"
          className={`text-xs sm:col-span-2 ${status.ok ? 'text-success' : 'text-danger'}`}
        >
          {status.text}
        </p>
      ) : null}
      <Button type="submit" loading={pending} className="justify-self-start sm:col-span-2">
        Salvar configurações
      </Button>
    </form>
  )
}
