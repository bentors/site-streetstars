import 'server-only'
import { isCents } from '@/lib/money'

export type OrderTotals = {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
}

export function computeTotals(input: {
  subtotalCents: number
  discountCents: number
  shippingCents: number
}): OrderTotals {
  for (const [name, value] of Object.entries(input)) {
    if (!isCents(value)) throw new RangeError(`${name} inválido: ${value}`)
  }
  const discountCents = Math.min(input.discountCents, input.subtotalCents)
  return {
    subtotalCents: input.subtotalCents,
    discountCents,
    shippingCents: input.shippingCents,
    totalCents: input.subtotalCents - discountCents + input.shippingCents,
  }
}
