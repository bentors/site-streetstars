import 'server-only'
import { sanitizeLines } from '@/lib/cart'
import { getProductsByIds, type Product } from '@/server/db/products'
import { priceLines, type PricedCart } from '@/server/domain/cart-pricing'

export type CheckoutCart = { priced: PricedCart; products: Product[] }

export async function loadCheckoutCart(rawLines: unknown): Promise<CheckoutCart> {
  const lines = sanitizeLines(rawLines)
  const products = lines.length > 0 ? await getProductsByIds(lines.map((l) => l.productId)) : []
  return { priced: priceLines(lines, products), products }
}
