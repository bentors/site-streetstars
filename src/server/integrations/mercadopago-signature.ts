import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Assinatura dos webhooks do Mercado Pago:
 * x-signature "ts=...,v1=..." = HMAC-SHA256(secret, "id:<data.id>;request-id:<x-request-id>;ts:<ts>;").
 * Partes ausentes saem do manifesto; data.id alfanumérico entra em minúsculas.
 */
export function verifyMercadoPagoSignature(input: {
  signature: string | null
  requestId: string | null
  dataId: string | null
  secret: string
}): boolean {
  if (!input.signature) return false
  const parts = new Map(
    input.signature.split(',').map((part) => {
      const [key = '', ...value] = part.split('=')
      return [key.trim(), value.join('=').trim()] as const
    }),
  )
  const ts = parts.get('ts')
  const v1 = parts.get('v1')
  if (!ts || !v1) return false

  const id =
    input.dataId && /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId
  let manifest = ''
  if (id) manifest += `id:${id};`
  if (input.requestId) manifest += `request-id:${input.requestId};`
  manifest += `ts:${ts};`

  const expected = Buffer.from(createHmac('sha256', input.secret).update(manifest).digest('hex'))
  const given = Buffer.from(v1)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
