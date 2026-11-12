import 'server-only'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { AddressInput, ProfileInput } from '@/lib/account'
import type { CheckoutAddress } from '@/lib/checkout'
import { fail, ok, type Result } from '@/lib/result'
import {
  addAddress,
  removeAddress,
  sameAddress,
  setDefaultAddress,
  updateAddress,
} from '@/server/domain/addresses'
import { zodConverter } from './convert'
import { db } from './firebase-admin'

export const addressSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  cep: z.string().regex(/^\d{8}$/),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  isDefault: z.boolean(),
})

export const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  cpf: z.string().nullable(),
  marketingConsent: z.object({ value: z.boolean(), at: z.date() }),
  addresses: z.array(addressSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Address = z.infer<typeof addressSchema>
export type UserDoc = z.infer<typeof userSchema>

const users = () => db().collection('users').withConverter(zodConverter(userSchema))

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snapshot = await users().doc(uid).get()
  return snapshot.data() ?? null
}

export async function ensureUser(input: {
  uid: string
  email: string
  name: string | null
}): Promise<UserDoc> {
  const ref = users().doc(input.uid)
  return db().runTransaction(async (tx) => {
    const existing = (await tx.get(ref)).data()
    if (existing) return existing

    const now = new Date()
    const user: UserDoc = {
      name: input.name ?? '',
      email: input.email,
      phone: null,
      cpf: null,
      marketingConsent: { value: false, at: now },
      addresses: [],
      createdAt: now,
      updatedAt: now,
    }
    tx.create(ref, user)
    return user
  })
}

type Change = (user: UserDoc) => Result<Partial<UserDoc>>

/** Lê, decide e grava o perfil inteiro numa transação (sem perder edições simultâneas). */
async function mutateUser(uid: string, now: Date, change: Change): Promise<Result<UserDoc>> {
  const ref = users().doc(uid)
  return db().runTransaction(async (tx) => {
    const user = (await tx.get(ref)).data()
    if (!user) return fail('not_found', 'Conta não encontrada.')
    const patch = change(user)
    if (!patch.ok) return patch
    const next: UserDoc = { ...user, ...patch.data, updatedAt: now }
    tx.set(ref, next)
    return ok(next)
  })
}

const withAddresses = (result: Result<Address[]>): Result<Partial<UserDoc>> =>
  result.ok ? ok({ addresses: result.data }) : result

export function saveProfile(uid: string, input: ProfileInput, now: Date) {
  return mutateUser(uid, now, (user) =>
    ok({
      name: input.name,
      phone: input.phone,
      cpf: input.cpf,
      marketingConsent:
        user.marketingConsent.value === input.marketingConsent
          ? user.marketingConsent
          : { value: input.marketingConsent, at: now },
    }),
  )
}

export function addUserAddress(uid: string, input: AddressInput, now: Date) {
  return mutateUser(uid, now, (user) =>
    withAddresses(addAddress(user.addresses, input, randomUUID())),
  )
}

export function updateUserAddress(uid: string, id: string, input: AddressInput, now: Date) {
  return mutateUser(uid, now, (user) => withAddresses(updateAddress(user.addresses, id, input)))
}

export function removeUserAddress(uid: string, id: string, now: Date) {
  return mutateUser(uid, now, (user) => ok({ addresses: removeAddress(user.addresses, id) }))
}

export function setDefaultUserAddress(uid: string, id: string, now: Date) {
  return mutateUser(uid, now, (user) => withAddresses(setDefaultAddress(user.addresses, id)))
}

/** Depois de um pedido: completa o perfil sem sobrescrever o que o cliente já editou. */
export function rememberCheckoutDetails(
  uid: string,
  details: { phone: string; cpf: string; address: CheckoutAddress | null },
  now: Date,
) {
  return mutateUser(uid, now, (user) => {
    const { address } = details
    const added =
      address && !user.addresses.some((saved) => sameAddress(saved, address))
        ? addAddress(user.addresses, { ...address, label: '', isDefault: false }, randomUUID())
        : null
    return ok({
      phone: user.phone ?? details.phone,
      cpf: user.cpf ?? details.cpf,
      // Lista cheia: o pedido segue e o endereço só não é salvo.
      addresses: added?.ok ? added.data : user.addresses,
    })
  })
}
