'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Badge, Button, Checkbox, Field, Select, TextField } from '@/components/ui'
import {
  couponFormSchema,
  couponToForm,
  couponUpdateSchema,
  type CouponFormValues,
} from '@/lib/admin-coupon'
import { formatDateTime } from '@/lib/format-date'
import { fieldErrors } from '@/lib/form-errors'
import { formatBRL } from '@/lib/money'
import { createCouponAction, updateCouponAction } from './coupon-actions'
import { attempt } from '@/lib/attempt'

type Row = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotalCents: number | null
  startsAt: Date | null
  endsAt: Date | null
  maxUses: number | null
  usedCount: number
  active: boolean
}

function CouponForm({ row, onDone }: { row: Row | null; onDone: () => void }) {
  const editing = row !== null
  const [values, setValues] = useState<CouponFormValues>(couponToForm(row))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const set = (patch: Partial<CouponFormValues>) =>
    setValues((current) => ({ ...current, ...patch }))

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const parsed = (editing ? couponUpdateSchema : couponFormSchema).safeParse(values)
    setErrors(parsed.success ? {} : fieldErrors(parsed.error))
    if (!parsed.success) return
    start(async () => {
      const result = row
        ? await attempt(() => updateCouponAction(row.code, values))
        : await attempt(() => createCouponAction(values))
      if (result.ok) onDone()
      else setMessage(result.message)
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 border border-line p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Código"
          disabled={editing}
          value={values.code}
          error={errors.code}
          onValue={(code) => set({ code })}
        />
        <Field label="Tipo">
          {(control) => (
            <Select
              {...control}
              disabled={editing}
              value={values.type}
              onChange={(e) => set({ type: e.target.value as CouponFormValues['type'] })}
            >
              <option value="percent">Percentual</option>
              <option value="fixed">Valor fixo</option>
            </Select>
          )}
        </Field>
        <TextField
          label={values.type === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
          disabled={editing}
          inputMode="decimal"
          value={values.value}
          error={errors.value}
          onValue={(value) => set({ value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <TextField
          label="Pedido mínimo (R$)"
          inputMode="decimal"
          value={values.minSubtotal}
          error={errors.minSubtotal}
          onValue={(minSubtotal) => set({ minSubtotal })}
        />
        <TextField
          label="Início"
          type="datetime-local"
          value={values.startsAt}
          error={errors.startsAt}
          onValue={(startsAt) => set({ startsAt })}
        />
        <TextField
          label="Fim"
          type="datetime-local"
          value={values.endsAt}
          error={errors.endsAt}
          onValue={(endsAt) => set({ endsAt })}
        />
        <TextField
          label="Limite de usos"
          inputMode="numeric"
          value={values.maxUses}
          error={errors.maxUses}
          onValue={(maxUses) => set({ maxUses })}
        />
      </div>
      <Checkbox
        label="Ativo"
        checked={values.active}
        onChange={(e) => set({ active: e.target.checked })}
      />
      {message ? (
        <p role="alert" className="text-xs text-danger">
          {message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          Salvar cupom
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export function CouponManager({ coupons }: { coupons: Row[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const done = () => {
    setEditing(null)
    router.refresh()
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      {editing ? (
        <CouponForm
          key={editing === 'new' ? 'new' : editing.code}
          row={editing === 'new' ? null : editing}
          onDone={done}
        />
      ) : (
        <Button variant="secondary" className="self-start" onClick={() => setEditing('new')}>
          Novo cupom
        </Button>
      )}
      {coupons.length === 0 ? <p className="text-xs text-muted">Nenhum cupom ainda.</p> : null}
      <ul className="flex flex-col divide-y divide-line border border-line">
        {coupons.map((coupon) => (
          <li key={coupon.code} className="flex flex-wrap items-center gap-4 p-4 text-xs">
            <span className="w-32 font-mono font-bold">{coupon.code}</span>
            <span>{coupon.type === 'percent' ? `${coupon.value}%` : formatBRL(coupon.value)}</span>
            <span className="text-muted">
              {coupon.maxUses === null
                ? `${coupon.usedCount} usos`
                : `${coupon.usedCount} / ${coupon.maxUses} usos`}
            </span>
            <span className="flex-1 font-mono text-[10px] text-muted">
              {coupon.startsAt ? formatDateTime(coupon.startsAt) : 'sempre'} →{' '}
              {coupon.endsAt ? formatDateTime(coupon.endsAt) : 'sem fim'}
            </span>
            <Badge tone={coupon.active ? 'success' : 'neutral'}>
              {coupon.active ? 'Ativo' : 'Inativo'}
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => setEditing(coupon)}>
              Editar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
