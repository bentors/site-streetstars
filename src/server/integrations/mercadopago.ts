import 'server-only'
import { z } from 'zod'
import type { OrderDoc } from '@/server/db/orders'
import { serverEnv } from '@/server/env'

const API = 'https://api.mercadopago.com'
export const MAX_INSTALLMENTS = 6

export type PreferenceOrder = Pick<
  OrderDoc,
  'number' | 'customer' | 'items' | 'totals' | 'expiresAt'
> & { id: string }

const reais = (cents: number) => cents / 100

export function buildPreferenceBody(
  order: PreferenceOrder,
  urls: { orderUrl: string; notificationUrl: string },
): Record<string, unknown> {
  // O Checkout Pro não aceita item negativo. Com desconto, um item só com o total garante que o
  // valor cobrado é exatamente totals.totalCents (o webhook confere) e nunca R$ 0.
  const itemized = order.totals.discountCents === 0
  const [firstName = '', ...lastNames] = order.customer.name.trim().split(/\s+/)

  return {
    items: itemized
      ? order.items.map((item) => ({
          id: item.productId,
          title: [item.name, item.size, item.color].filter(Boolean).join(' · '),
          quantity: item.qty,
          unit_price: reais(item.unitPriceCents),
          currency_id: 'BRL',
        }))
      : [
          {
            id: order.number,
            title: `Pedido ${order.number}`,
            quantity: 1,
            unit_price: reais(order.totals.totalCents),
            currency_id: 'BRL',
          },
        ],
    ...(itemized
      ? { shipments: { cost: reais(order.totals.shippingCents), mode: 'not_specified' } }
      : {}),
    payer: {
      name: firstName,
      surname: lastNames.join(' '),
      email: order.customer.email,
      identification: { type: 'CPF', number: order.customer.cpf },
    },
    back_urls: { success: urls.orderUrl, failure: urls.orderUrl, pending: urls.orderUrl },
    // O MP recusa auto_return com back_url sem https (localhost).
    ...(urls.orderUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
    external_reference: order.id,
    notification_url: urls.notificationUrl,
    statement_descriptor: 'STREETSTARS',
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
      installments: MAX_INSTALLMENTS,
    },
    expires: true,
    expiration_date_to: order.expiresAt.toISOString(),
  }
}

async function mercadoPago(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = serverEnv().MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN ausente')
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Mercado Pago respondeu ${response.status} em ${path}`)
  return response.json()
}

const preferenceSchema = z.object({ id: z.string(), init_point: z.url() })

export async function createPreference(
  body: Record<string, unknown>,
): Promise<{ preferenceId: string; initPoint: string }> {
  const data = preferenceSchema.parse(
    await mercadoPago('/checkout/preferences', { method: 'POST', body: JSON.stringify(body) }),
  )
  return { preferenceId: data.id, initPoint: data.init_point }
}

export type MpPayment = {
  id: string
  status: string
  externalReference: string | null
  amountCents: number
  method: string | null
  approvedAt: Date | null
}

const paymentSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(String),
  status: z.string(),
  external_reference: z.string().nullish(),
  transaction_amount: z.number(),
  payment_method_id: z.string().nullish(),
  payment_type_id: z.string().nullish(),
  date_approved: z.string().nullish(),
})

export async function getPayment(id: string): Promise<MpPayment> {
  if (!/^\d{1,20}$/.test(id)) throw new Error(`id de pagamento inválido: ${id}`)
  const data = paymentSchema.parse(await mercadoPago(`/v1/payments/${id}`))
  return {
    id: data.id,
    status: data.status,
    externalReference: data.external_reference ?? null,
    amountCents: Math.round(data.transaction_amount * 100),
    method: data.payment_method_id ?? data.payment_type_id ?? null,
    approvedAt: data.date_approved ? new Date(data.date_approved) : null,
  }
}
