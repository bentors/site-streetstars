import 'server-only'
import { lineKey, MAX_QTY, type CartLine } from '@/lib/cart'
import type { Product } from '@/server/db/products'

export type PricedLine = {
  key: string
  productId: string
  slug: string
  name: string
  image: string
  size: string
  color: string | null
  unitPriceCents: number
  qty: number
  lineTotalCents: number
}

export type PricedCart = { lines: PricedLine[]; removedKeys: string[]; subtotalCents: number }

type PricingProduct = Pick<
  Product,
  'id' | 'slug' | 'name' | 'priceCents' | 'sizes' | 'colors' | 'images' | 'status'
>

export function priceLines(lines: CartLine[], products: PricingProduct[]): PricedCart {
  const byId = new Map(products.map((product) => [product.id, product]))
  const priced: PricedLine[] = []
  const removedKeys: string[] = []

  for (const line of lines) {
    const key = lineKey(line)
    const product = byId.get(line.productId)
    const color = product?.colors.find((c) => c.name === line.color)
    const colorOk = product ? (product.colors.length === 0 ? line.color === null : !!color) : false

    if (!product || product.status !== 'active' || !product.sizes.includes(line.size) || !colorOk) {
      removedKeys.push(key)
      continue
    }

    const qty = Math.min(MAX_QTY, line.qty)
    priced.push({
      key,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: color?.image ?? product.images[0]?.url ?? '',
      size: line.size,
      color: line.color,
      unitPriceCents: product.priceCents,
      qty,
      lineTotalCents: product.priceCents * qty,
    })
  }

  return {
    lines: priced,
    removedKeys,
    subtotalCents: priced.reduce((total, line) => total + line.lineTotalCents, 0),
  }
}
