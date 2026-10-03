import 'server-only'
import { z } from 'zod'
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
