'use server'

import { isValidCep, normalizeCep } from '@/lib/cep'
import type { ShippingOption } from '@/lib/checkout'
import { fail, ok, type Result } from '@/lib/result'
import { getSessionUser } from '@/server/auth/session'
import { loadCheckoutCart } from '@/server/checkout/cart'
import { createOrder } from '@/server/checkout/create-order'
import { shippingOptionsFor } from '@/server/checkout/shipping'
import { getCouponRule } from '@/server/db/coupons'
import { applyCoupon, type AppliedCoupon } from '@/server/domain/coupons'
import { lookupCep, type CepAddress } from '@/server/integrations/viacep'
import { clientIp, rateLimit, type RateLimitRule } from '@/server/ratelimit'

const LIMITED = fail('rate_limited', 'Muitas tentativas. Aguarde um instante e tente de novo.')
const CART_EMPTY = fail('cart_empty', 'Sua sacola está vazia.')

async function allowed(scope: string, rule: RateLimitRule): Promise<boolean> {
  return rateLimit(`${scope}:${await clientIp()}`, rule)
}

function cepFrom(raw: unknown): string | null {
  const cep = normalizeCep(String(raw ?? ''))
  return isValidCep(cep) ? cep : null
}

export async function lookupCepAction(rawCep: unknown): Promise<Result<CepAddress>> {
  const cep = cepFrom(rawCep)
  if (!cep) return fail('invalid_cep', 'CEP inválido.')
  if (!(await allowed('cep', { limit: 30, windowSec: 60 }))) return LIMITED
  try {
    const address = await lookupCep(cep)
    return address ? ok(address) : fail('cep_not_found', 'CEP não encontrado.')
  } catch (error) {
    console.error('lookupCep: falha no ViaCEP', { cep, error })
    return fail('cep_unavailable', 'Não conseguimos buscar o CEP. Preencha o endereço manualmente.')
  }
}

export async function quoteShippingAction(
  rawCep: unknown,
  rawLines: unknown,
): Promise<Result<ShippingOption[]>> {
  const cep = cepFrom(rawCep)
  if (!cep) return fail('invalid_cep', 'CEP inválido.')
  if (!(await allowed('shipping', { limit: 30, windowSec: 60 }))) return LIMITED
  const cart = await loadCheckoutCart(rawLines)
  if (cart.priced.lines.length === 0) return CART_EMPTY
  return shippingOptionsFor(cep, cart)
}

export async function previewCouponAction(
  rawCode: unknown,
  rawLines: unknown,
): Promise<Result<AppliedCoupon>> {
  if (!(await allowed('coupon', { limit: 20, windowSec: 60 }))) return LIMITED
  const cart = await loadCheckoutCart(rawLines)
  if (cart.priced.lines.length === 0) return CART_EMPTY
  const coupon = await getCouponRule(String(rawCode ?? ''))
  return applyCoupon(coupon, cart.priced.subtotalCents, new Date())
}

export async function createOrderAction(input: unknown): Promise<Result<{ redirectUrl: string }>> {
  if (!(await allowed('order', { limit: 10, windowSec: 60 }))) return LIMITED
  const email = (input as { customer?: { email?: unknown } } | null)?.customer?.email
  if (typeof email === 'string') {
    const key = `order-email:${email.trim().toLowerCase()}`
    if (!(await rateLimit(key, { limit: 5, windowSec: 600 }))) return LIMITED
  }
  const user = await getSessionUser()
  return createOrder(input, { uid: user?.uid ?? null, now: new Date() })
}
