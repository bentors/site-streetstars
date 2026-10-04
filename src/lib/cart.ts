import { z } from 'zod'

export const MAX_QTY = 10
export const MAX_LINES = 30
export const CART_STORAGE_KEY = 'streetstars:cart:v2'

export type CartLine = { productId: string; size: string; color: string | null; qty: number }

const lineSchema = z.object({
  productId: z.string().min(1).max(64),
  size: z.string().min(1).max(20),
  color: z.string().min(1).max(40).nullable(),
  qty: z.number().int(),
})

const clampQty = (qty: number) => Math.min(MAX_QTY, Math.max(0, Math.trunc(qty)))

export function lineKey(line: Pick<CartLine, 'productId' | 'size' | 'color'>): string {
  return `${line.productId}|${line.size}|${line.color ?? ''}`
}

export function addLine(lines: CartLine[], item: Omit<CartLine, 'qty'>, qty = 1): CartLine[] {
  const key = lineKey(item)
  const existing = lines.find((line) => lineKey(line) === key)
  if (!existing) return [...lines, { ...item, qty: clampQty(qty) }]
  return lines.map((line) =>
    lineKey(line) === key ? { ...line, qty: clampQty(line.qty + qty) } : line,
  )
}

export function setLineQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  const next = clampQty(qty)
  if (next < 1) return removeLine(lines, key)
  return lines.map((line) => (lineKey(line) === key ? { ...line, qty: next } : line))
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((line) => lineKey(line) !== key)
}

/** Aceita qualquer coisa vinda do navegador e devolve só linhas válidas, sem repetição. */
export function sanitizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return []
  let lines: CartLine[] = []
  for (const item of raw) {
    const parsed = lineSchema.safeParse(item)
    if (!parsed.success || parsed.data.qty < 1) continue
    lines = addLine(lines, parsed.data, parsed.data.qty)
  }
  return lines.slice(0, MAX_LINES)
}

export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    return sanitizeLines(JSON.parse(raw))
  } catch {
    return []
  }
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines)
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.qty, 0)
}
