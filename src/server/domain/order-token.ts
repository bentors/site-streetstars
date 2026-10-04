import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

// O link é "<orderId>.<hmac>": dá para recalcular a qualquer momento (o webhook monta o
// link do e-mail), sem guardar segredo por pedido. Trocar o segredo invalida todos os links.
const ORDER_ID = /^[A-Za-z0-9]{1,64}$/

function sign(orderId: string, secret: string): string {
  return createHmac('sha256', secret).update(orderId).digest('base64url')
}

export function createOrderToken(orderId: string, secret: string): string {
  return `${orderId}.${sign(orderId, secret)}`
}

export function readOrderToken(token: string, secret: string): string | null {
  const parts = token.split('.')
  const [orderId, mac] = parts
  if (parts.length !== 2 || !orderId || !mac || !ORDER_ID.test(orderId)) return null
  const expected = Buffer.from(sign(orderId, secret))
  const given = Buffer.from(mac)
  return given.length === expected.length && timingSafeEqual(given, expected) ? orderId : null
}
