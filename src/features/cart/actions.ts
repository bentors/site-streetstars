'use server'

import { sanitizeLines } from '@/lib/cart'
import { getProductsByIds } from '@/server/db/products'
import { priceLines, type PricedCart } from '@/server/domain/cart-pricing'
import { clientIp, rateLimit } from '@/server/ratelimit'

const EMPTY: PricedCart = { lines: [], removedKeys: [], subtotalCents: 0 }

export async function priceCartAction(rawLines: unknown): Promise<PricedCart> {
  if (!(await rateLimit(`cart:${await clientIp()}`, { limit: 60, windowSec: 60 }))) {
    throw new Error('Muitas requisições. Tente novamente em instantes.')
  }
  const lines = sanitizeLines(rawLines)
  if (lines.length === 0) return EMPTY
  const products = await getProductsByIds(lines.map((line) => line.productId))
  return priceLines(lines, products)
}
