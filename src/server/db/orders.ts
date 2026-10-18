import 'server-only'
import { FieldValue, type Query, type Transaction } from 'firebase-admin/firestore'
import { z } from 'zod'
import type { AdminTransition } from '@/lib/admin-orders'
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from '@/lib/order-status'
import { fail, ok, type Result } from '@/lib/result'
import { adminTargets, trackingUrl } from '@/server/domain/admin-order'
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
  /** Quando o admin abriu o pedido pago (indicador de "novo" no painel). */
  adminSeenAt: z.date().nullable().default(null),
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

export async function listUserOrders(uid: string): Promise<Order[]> {
  const snapshot = await ordersCollection()
    .where('customer.uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

/** Pedidos feitos sem login passam para a conta. Só chame com e-mail verificado. */
export async function linkGuestOrders(uid: string, email: string): Promise<number> {
  const query = ordersCollection()
    .where('customer.email', '==', email.trim().toLowerCase())
    .where('customer.uid', '==', null)
  // ponytail: uma transação aguenta 500 escritas; um e-mail nunca terá tantos pedidos sem conta.
  return db().runTransaction(async (tx) => {
    const snapshot = await tx.get(query)
    const now = new Date()
    for (const doc of snapshot.docs) tx.update(doc.ref, { 'customer.uid': uid, updatedAt: now })
    return snapshot.size
  })
}

export type AdminOrderFilter = { status: OrderStatus | null; search: string }

const toOrders = (docs: { id: string; data: () => OrderDoc }[]): Order[] =>
  docs.map((doc) => ({ id: doc.id, ...doc.data() }))

export async function listAdminOrders({ status, search }: AdminOrderFilter): Promise<Order[]> {
  const term = search.trim()
  const number = /^(?:ss-)?(\d+)$/i.exec(term)?.[1]
  let query: Query<OrderDoc>
  if (number) query = ordersCollection().where('number', '==', `SS-${number}`)
  else if (term.includes('@')) {
    query = ordersCollection().where('customer.email', '==', term.toLowerCase())
  } else if (term) return []
  else if (status) {
    query = ordersCollection().where('status', '==', status).orderBy('createdAt', 'desc')
  } else query = ordersCollection().orderBy('createdAt', 'desc')

  // Busca por número/e-mail usa só igualdade (sem índice composto); status e ordem em memória.
  return toOrders((await query.limit(100).get()).docs)
    .filter((order) => !status || order.status === status)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/** Pagos que o admin ainda não abriu. Filtra em memória: pedido antigo pode não ter o campo. */
export async function listUnseenPaidOrders(): Promise<Order[]> {
  // ponytail: até 200 pagos de uma vez; acima disso, contar com índice em adminSeenAt.
  const snapshot = await ordersCollection().where('status', '==', 'paid').limit(200).get()
  return toOrders(snapshot.docs).filter((order) => !order.adminSeenAt)
}

export async function markOrderSeen(id: string, now: Date): Promise<void> {
  const ref = ordersCollection().doc(id)
  const order = (await ref.get()).data()
  if (order && !order.adminSeenAt) await ref.update({ adminSeenAt: now })
}

export async function applyAdminTransition(
  id: string,
  input: AdminTransition,
  by: string,
  now: Date,
): Promise<Result<Order>> {
  const ref = ordersCollection().doc(id)
  return db().runTransaction(async (tx) => {
    // Relê aqui: o webhook pode ter mudado o pedido depois que a página carregou.
    const order = (await tx.get(ref)).data()
    if (!order) return fail('not_found', 'Pedido não encontrado.')
    if (!adminTargets(order.status).includes(input.to)) {
      return fail(
        'invalid_transition',
        `Não é possível passar de "${ORDER_STATUS_LABELS[order.status]}" para "${ORDER_STATUS_LABELS[input.to]}". Recarregue a página.`,
      )
    }
    const tracking =
      input.to === 'shipped'
        ? {
            carrier: order.shipping.company || 'Correios',
            code: input.trackingCode,
            url: trackingUrl(input.trackingCode),
          }
        : order.tracking
    const entry = { status: input.to, at: now, by, ...(input.note ? { note: input.note } : {}) }
    tx.update(ref, {
      status: input.to,
      tracking,
      statusHistory: FieldValue.arrayUnion(entry),
      updatedAt: now,
    })
    return ok({
      id,
      ...order,
      status: input.to,
      tracking,
      statusHistory: [...order.statusHistory, entry],
      updatedAt: now,
    })
  })
}
