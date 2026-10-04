import 'server-only'
import type { Transaction } from 'firebase-admin/firestore'
import { z } from 'zod'
import { ORDER_STATUSES } from '@/lib/order-status'
import { zodConverter } from './convert'
import { db } from './firebase-admin'

const cents = z.number().int().min(0)

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  image: z.string(),
  size: z.string().min(1),
  color: z.string().nullable(),
  unitPriceCents: cents,
  qty: z.number().int().min(1).max(10),
  lineTotalCents: cents,
})

export const shippingAddressSchema = z.object({
  cep: z.string().regex(/^\d{8}$/),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().regex(/^[A-Z]{2}$/),
})

export const statusEntrySchema = z.object({
  status: z.enum(ORDER_STATUSES),
  at: z.date(),
  /** 'system', 'webhook' ou o uid do admin. */
  by: z.string().min(1),
  note: z.string().optional(),
  /** Pagamento do Mercado Pago que gerou a entrada (webhook). */
  paymentId: z.string().optional(),
})

export const orderSchema = z.object({
  number: z.string().regex(/^SS-\d+$/),
  idempotencyKey: z.string().min(1),
  customer: z.object({
    uid: z.string().nullable(),
    email: z.email(),
    name: z.string().min(1),
    phone: z.string(),
    cpf: z.string(),
  }),
  items: z.array(orderItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  shipping: z.object({
    serviceId: z.number().int(),
    name: z.string(),
    company: z.string(),
    priceCents: cents,
    deliveryDays: z.number().int().min(0),
    productionDays: z.number().int().min(0),
  }),
  coupon: z
    .object({
      code: z.string(),
      type: z.enum(['percent', 'fixed']),
      value: z.number().int(),
      discountCents: cents,
    })
    .nullable(),
  totals: z.object({
    subtotalCents: cents,
    discountCents: cents,
    shippingCents: cents,
    totalCents: cents,
  }),
  status: z.enum(ORDER_STATUSES),
  statusHistory: z.array(statusEntrySchema),
  payment: z.object({
    preferenceId: z.string().nullable(),
    paymentId: z.string().nullable(),
    status: z.string().nullable(),
    method: z.string().nullable(),
    paidAmountCents: cents.nullable(),
    paidAt: z.date().nullable(),
  }),
  tracking: z
    .object({ carrier: z.string(), code: z.string(), url: z.string().nullable() })
    .nullable(),
  notifications: z.object({
    confirmationSentAt: z.date().nullable(),
    shippedSentAt: z.date().nullable(),
    /** E-mail de "novo pedido pago" para a loja. */
    adminAlertSentAt: z.date().nullable(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date(),
})

export type OrderDoc = z.infer<typeof orderSchema>
export type Order = OrderDoc & { id: string }
export type OrderItem = z.infer<typeof orderItemSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type StatusEntry = z.infer<typeof statusEntrySchema>

const FIRST_ORDER_NUMBER = 1001

export const ordersCollection = () =>
  db().collection('orders').withConverter(zodConverter(orderSchema))

export async function getOrder(id: string): Promise<Order | null> {
  const snapshot = await ordersCollection().doc(id).get()
  const data = snapshot.data()
  return data ? { id: snapshot.id, ...data } : null
}

export function idempotencyQuery(key: string) {
  return ordersCollection().where('idempotencyKey', '==', key).limit(1)
}

export async function findOrderByIdempotencyKey(key: string): Promise<Order | null> {
  const doc = (await idempotencyQuery(key).get()).docs[0]
  return doc ? { id: doc.id, ...doc.data() } : null
}

/** Lê e incrementa counters/orders. Deve ser a última leitura da transação. */
export async function nextOrderNumber(tx: Transaction): Promise<string> {
  const ref = db().doc('counters/orders')
  const snapshot = await tx.get(ref)
  const last = snapshot.exists ? Number(snapshot.get('last')) : FIRST_ORDER_NUMBER - 1
  tx.set(ref, { last: last + 1 })
  return `SS-${last + 1}`
}
