'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Badge, Button, Checkbox, TextField } from '@/components/ui'
import {
  AddressFields,
  EMPTY_ADDRESS,
  type AddressErrors,
  type AddressValues,
} from '@/features/checkout/address-fields'
import { lookupCepAction } from '@/features/checkout/actions'
import { addressInputSchema, MAX_ADDRESSES, type SavedAddress } from '@/lib/account'
import { fillFromCep, formatCep, normalizeCep } from '@/lib/cep'
import { fieldErrors } from '@/lib/form-errors'
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from './actions'
import { attempt } from '@/lib/attempt'
import type { Result } from '@/lib/result'

type Draft = AddressValues & { label: string; isDefault: boolean }
type Editing = { id: string | null; draft: Draft } | null

function AddressForm({
  editing,
  onCancel,
  onSaved,
}: {
  editing: NonNullable<Editing>
  onCancel: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>(editing.draft)
  const [errors, setErrors] = useState<AddressErrors & { label?: string }>({})
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [, startLookup] = useTransition()
  const lookup = useRef(0)
  const patch = (next: Partial<Draft>) => setDraft((current) => ({ ...current, ...next }))

  function onCepChange(raw: string) {
    patch({ cep: formatCep(raw) })
    setErrors((current) => ({ ...current, cep: undefined }))
    const cep = normalizeCep(raw)
    // Só a busca mais recente vale; a transição é separada da do salvar.
    const id = ++lookup.current
    if (cep.length !== 8) return
    startLookup(async () => {
      try {
        const found = await lookupCepAction(cep)
        if (id !== lookup.current) return
        if (found.ok) setDraft((current) => fillFromCep(current, found.data))
        else if (found.code !== 'cep_unavailable') {
          setErrors((current) => ({ ...current, cep: found.message }))
        }
      } catch {
        // Sem conexão: o cliente preenche o endereço à mão.
      }
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const parsed = addressInputSchema.safeParse(draft)
    setErrors(parsed.success ? {} : fieldErrors(parsed.error))
    if (!parsed.success) return
    start(async () => {
      const result = await attempt(() => saveAddressAction(editing.id, draft))
      if (result.ok) onSaved()
      else setMessage(result.message)
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 border border-line p-5">
      <TextField
        label="Apelido (opcional)"
        placeholder="Casa, trabalho…"
        value={draft.label}
        error={errors.label}
        onValue={(label) => patch({ label })}
      />
      <AddressFields value={draft} errors={errors} onChange={patch} onCepChange={onCepChange} />
      <Checkbox
        checked={draft.isDefault}
        onChange={(event) => patch({ isDefault: event.target.checked })}
        label="Usar como endereço padrão"
      />
      {message ? (
        <p role="alert" className="text-xs text-danger">
          {message}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" loading={pending}>
          Salvar endereço
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Editing>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function run(action: () => Promise<Result<null>>) {
    setMessage(null)
    start(async () => {
      const result = await attempt(action)
      if (!result.ok) setMessage(result.message ?? 'Algo deu errado. Tente novamente.')
      router.refresh()
    })
  }

  const saved = () => {
    setEditing(null)
    router.refresh()
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {message ? (
        <p role="alert" className="text-xs text-danger">
          {message}
        </p>
      ) : null}
      <ul className="flex flex-col gap-4">
        {addresses.map((address) => (
          <li key={address.id} className="flex flex-col gap-3 border border-line p-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest uppercase">
                {address.label || 'Endereço'}
              </span>
              {address.isDefault ? <Badge tone="success">Padrão</Badge> : null}
            </div>
            <p className="text-xs leading-relaxed text-muted">
              {address.street}, {address.number}
              {address.complement ? ` — ${address.complement}` : ''}
              <br />
              {address.neighborhood} · {address.city}/{address.state} · CEP {formatCep(address.cep)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() =>
                  setEditing({ id: address.id, draft: { ...address, cep: formatCep(address.cep) } })
                }
              >
                Editar
              </Button>
              {address.isDefault ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => setDefaultAddressAction(address.id))}
                >
                  Tornar padrão
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  if (window.confirm('Excluir este endereço?')) {
                    run(() => deleteAddressAction(address.id))
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <AddressForm
          key={editing.id ?? 'new'}
          editing={editing}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      ) : addresses.length < MAX_ADDRESSES ? (
        <Button
          variant="secondary"
          className="self-start"
          onClick={() =>
            setEditing({
              id: null,
              draft: { ...EMPTY_ADDRESS, label: '', isDefault: addresses.length === 0 },
            })
          }
        >
          Novo endereço
        </Button>
      ) : (
        <p className="text-xs text-muted">Você chegou ao limite de {MAX_ADDRESSES} endereços.</p>
      )}
    </div>
  )
}
