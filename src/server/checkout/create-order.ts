import 'server-only'
import { createOrderInputSchema } from '@/lib/checkout'
import { fail, ok, type Result } from '@/lib/result'
import { getCouponRule } from '@/server/db/coupons'
import { db } from '@/server/db/firebase-admin'
import {
  findOrderByIdempotencyKey,
  idempotencyQuery,
  nextOrderNumber,
  ordersCollection,
  type Order,
  type OrderDoc,
} from '@/server/db/orders'
import { applyCoupon, type AppliedCoupon } from '@/server/domain/coupons'
import { computeTotals } from '@/server/domain/pricing'
import { paymentRedirectUrl } from '@/server/orders/payment'
import { loadCheckoutCart } from './cart'
import { shippingOptionsFor } from './shipping'

const ORDER_TTL_MS = 48 * 60 * 60 * 1000

type Context = { uid: string | null; now: Date }

export async function createOrder(
  rawInput: unknown,
  ctx: Context,
): Promise<Result<{ redirectUrl: string }>> {
  const parsed = createOrderInputSchema.safeParse(rawInput)
  if (!parsed.success) return fail('invalid_input', 'Confira os dados do pedido.')
  const input = parsed.data

  // Clique duplo ou nova tentativa: reaproveita o pedido e gera outro link de pagamento.
  const existing = await findOrderByIdempotencyKey(input.idempotencyKey)
  if (existing) return redirectFor(existing, ctx.now)

  const cart = await loadCheckoutCart(input.lines)
  if (cart.priced.lines.length === 0 || cart.priced.removedKeys.length > 0) {
    return fail('cart_changed', 'Sua sacola mudou. Revise os itens antes de pagar.')
  }

  let coupon: AppliedCoupon | null = null
  if (input.couponCode) {
    const applied = applyCoupon(
      await getCouponRule(input.couponCode),
      cart.priced.subtotalCents,
      ctx.now,
    )
    if (!applied.ok) return applied
    coupon = applied.data
  }

  // O frete é sempre recotado aqui: preço vindo do navegador nunca é usado.
  const options = await shippingOptionsFor(input.address.cep, cart)
  if (!options.ok) return options
  const shipping = options.data.find((option) => option.serviceId === input.serviceId)
  if (!shipping) {
    return fail('shipping_changed', 'A opção de frete escolhida mudou. Escolha o frete de novo.')
  }

  const totals = computeTotals({
    subtotalCents: cart.priced.subtotalCents,
    discountCents: coupon?.discountCents ?? 0,
    shippingCents: shipping.priceCents,
  })

  const order = await db().runTransaction(async (tx): Promise<Order> => {
    const duplicate = (await tx.get(idempotencyQuery(input.idempotencyKey))).docs[0]
    if (duplicate) return { id: duplicate.id, ...duplicate.data() }

    const number = await nextOrderNumber(tx)
    const ref = ordersCollection().doc()
    const doc: OrderDoc = {
      number,
      idempotencyKey: input.idempotencyKey,
      customer: { uid: ctx.uid, ...input.customer },
      items: cart.priced.lines.map((line) => ({
        productId: line.productId,
        slug: line.slug,
        name: line.name,
        image: line.image,
        size: line.size,
        color: line.color,
        unitPriceCents: line.unitPriceCents,
        qty: line.qty,
        lineTotalCents: line.lineTotalCents,
      })),
      shippingAddress: input.address,
      shipping: {
        serviceId: shipping.serviceId,
        name: shipping.name,
        company: shipping.company,
        priceCents: shipping.priceCents,
        deliveryDays: shipping.deliveryDays,
        productionDays: shipping.productionDays,
      },
      coupon,
      totals,
      status: 'pending_payment',
      statusHistory: [{ status: 'pending_payment', at: ctx.now, by: 'system' }],
      payment: {
        preferenceId: null,
        paymentId: null,
        status: null,
        method: null,
        paidAmountCents: null,
        paidAt: null,
      },
      tracking: null,
      notifications: { confirmationSentAt: null, shippedSentAt: null, adminAlertSentAt: null },
      createdAt: ctx.now,
      updatedAt: ctx.now,
      expiresAt: new Date(ctx.now.getTime() + ORDER_TTL_MS),
    }
    tx.create(ref, doc)
    return { id: ref.id, ...doc }
  })

  return redirectFor(order, ctx.now)
}

async function redirectFor(order: Order, now: Date): Promise<Result<{ redirectUrl: string }>> {
  try {
    return ok({ redirectUrl: await paymentRedirectUrl(order, now) })
  } catch (error) {
    console.error('createOrder: falha ao criar a preferência', { orderId: order.id, error })
    return fail(
      'payment_unavailable',
      'Não foi possível abrir o pagamento agora. Tente de novo em instantes.',
    )
  }
}
