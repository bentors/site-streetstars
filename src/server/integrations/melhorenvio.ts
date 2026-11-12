import 'server-only'
import { z } from 'zod'
import { parseReaisToCents } from '@/lib/money'
import { serverEnv } from '@/server/env'

/** Correios PAC (1) e SEDEX (2): decisão da Fase 3. */
const SERVICES = '1,2'

const BASE_URL = {
  sandbox: 'https://sandbox.melhorenvio.com.br',
  production: 'https://melhorenvio.com.br',
} as const

export type ShippingQuote = {
  serviceId: number
  name: string
  company: string
  priceCents: number
  deliveryDays: number
}

const money = z.union([z.string(), z.number()]).transform(String)

const quotesSchema = z.array(
  z.object({
    id: z.number().int(),
    name: z.string(),
    error: z.string().optional(),
    price: money.optional(),
    custom_price: money.optional(),
    delivery_time: z.number().int().optional(),
    custom_delivery_time: z.number().int().optional(),
    company: z.object({ name: z.string() }).optional(),
  }),
)

export function parseQuotes(raw: unknown): ShippingQuote[] {
  const services = quotesSchema.parse(raw)
  return services
    .flatMap((service) => {
      if (service.error) return []
      // custom_* é o que a conta paga de fato (descontos e prazo extra configurados no painel).
      const priceCents = parseReaisToCents(service.custom_price ?? service.price ?? '')
      const deliveryDays = service.custom_delivery_time ?? service.delivery_time
      if (priceCents === null || deliveryDays === undefined) return []
      return [
        {
          serviceId: service.id,
          name: service.name,
          company: service.company?.name ?? '',
          priceCents,
          deliveryDays,
        },
      ]
    })
    .sort((a, b) => a.priceCents - b.priceCents)
}

export async function quoteShipping(input: {
  fromCep: string
  toCep: string
  weightGrams: number
  package: { heightCm: number; widthCm: number; lengthCm: number }
}): Promise<ShippingQuote[]> {
  const env = serverEnv()
  if (!env.MELHORENVIO_TOKEN) throw new Error('MELHORENVIO_TOKEN ausente')

  const response = await fetch(`${BASE_URL[env.MELHORENVIO_ENV]}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MELHORENVIO_TOKEN}`,
      // O Melhor Envio exige User-Agent com contato.
      'User-Agent': 'StreetStars (streetstars.company@gmail.com)',
    },
    body: JSON.stringify({
      from: { postal_code: input.fromCep },
      to: { postal_code: input.toCep },
      package: {
        height: input.package.heightCm,
        width: input.package.widthCm,
        length: input.package.lengthCm,
        weight: input.weightGrams / 1000,
      },
      options: { receipt: false, own_hand: false },
      services: SERVICES,
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Melhor Envio respondeu ${response.status}`)
  return parseQuotes(await response.json())
}
