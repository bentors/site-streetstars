'use client'

import { TextField } from '@/components/ui'

export type AddressValues = {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}
export type AddressErrors = Partial<Record<keyof AddressValues, string>>

export const EMPTY_ADDRESS: AddressValues = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}

export function AddressFields({
  value,
  errors,
  onChange,
  onCepChange,
}: {
  value: AddressValues
  errors: AddressErrors
  onChange: (patch: Partial<AddressValues>) => void
  /** Texto cru do campo CEP; quem usa formata e decide quando buscar. */
  onCepChange: (raw: string) => void
}) {
  const set = (key: keyof AddressValues) => (next: string) => onChange({ [key]: next })
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <TextField
          label="CEP"
          inputMode="numeric"
          autoComplete="postal-code"
          value={value.cep}
          error={errors.cep}
          onValue={onCepChange}
        />
        <TextField
          label="Rua"
          autoComplete="address-line1"
          value={value.street}
          error={errors.street}
          onValue={set('street')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Número"
          value={value.number}
          error={errors.number}
          onValue={set('number')}
        />
        <TextField
          label="Complemento"
          autoComplete="address-line2"
          value={value.complement}
          error={errors.complement}
          onValue={set('complement')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_80px]">
        <TextField
          label="Bairro"
          value={value.neighborhood}
          error={errors.neighborhood}
          onValue={set('neighborhood')}
        />
        <TextField
          label="Cidade"
          autoComplete="address-level2"
          value={value.city}
          error={errors.city}
          onValue={set('city')}
        />
        <TextField
          label="UF"
          maxLength={2}
          autoComplete="address-level1"
          value={value.state}
          error={errors.state}
          onValue={(state) => onChange({ state: state.toUpperCase() })}
        />
      </div>
    </>
  )
}
