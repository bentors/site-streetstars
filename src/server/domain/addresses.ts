import 'server-only'
import { MAX_ADDRESSES, type AddressInput, type SavedAddress } from '@/lib/account'
import type { CheckoutAddress } from '@/lib/checkout'
import { fail, ok, type Result } from '@/lib/result'

const NOT_FOUND = fail('not_found', 'Endereço não encontrado.')

/** Garante exatamente um padrão: o preferido, senão o atual, senão o primeiro. */
function withSingleDefault(list: SavedAddress[], preferred: string | null): SavedAddress[] {
  const target =
    (preferred && list.some((a) => a.id === preferred) ? preferred : null) ??
    list.find((a) => a.isDefault)?.id ??
    list[0]?.id
  return list.map((a) => ({ ...a, isDefault: a.id === target }))
}

export function addAddress(
  list: SavedAddress[],
  input: AddressInput,
  id: string,
): Result<SavedAddress[]> {
  if (list.length >= MAX_ADDRESSES) {
    return fail('address_limit', `Você pode salvar até ${MAX_ADDRESSES} endereços.`)
  }
  return ok(withSingleDefault([...list, { ...input, id }], input.isDefault ? id : null))
}

export function updateAddress(
  list: SavedAddress[],
  id: string,
  input: AddressInput,
): Result<SavedAddress[]> {
  if (!list.some((a) => a.id === id)) return NOT_FOUND
  const next = list.map((a) => (a.id === id ? { ...input, id } : a))
  return ok(withSingleDefault(next, input.isDefault ? id : null))
}

export function removeAddress(list: SavedAddress[], id: string): SavedAddress[] {
  return withSingleDefault(
    list.filter((a) => a.id !== id),
    null,
  )
}

export function setDefaultAddress(list: SavedAddress[], id: string): Result<SavedAddress[]> {
  if (!list.some((a) => a.id === id)) return NOT_FOUND
  return ok(withSingleDefault(list, id))
}

const norm = (value: string) => value.trim().toLowerCase()

export function sameAddress(a: CheckoutAddress, b: CheckoutAddress): boolean {
  return (
    a.cep === b.cep &&
    norm(a.street) === norm(b.street) &&
    norm(a.number) === norm(b.number) &&
    norm(a.complement) === norm(b.complement)
  )
}
