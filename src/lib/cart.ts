import { z } from 'zod'

export const MAX_QTY = 10
export const MAX_LINES = 30
export const CART_STORAGE_KEY = 'streetstars:cart:v2'
/** Limites que a sacola aceita; o formulário do admin usa os mesmos. */
export const MAX_SIZE_LENGTH = 20
export const MAX_COLOR_LENGTH = 40

export type CartLine = { productId: string; size: string; color: string | null; qty: number }

const lineSchema = z.object({
  // Formato de id do Firestore: '/' viraria um caminho e quebraria a leitura.
  productId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  size: z.string().min(1).max(MAX_SIZE_LENGTH),
  color: z.string().min(1).max(MAX_COLOR_LENGTH).nullable(),
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

/** Soma sobre a quantidade atual: dois cliques antes do servidor responder contam os dois. */
export function changeLineQty(lines: CartLine[], key: string, delta: number): CartLine[] {
  const line = lines.find((candidate) => lineKey(candidate) === key)
  return line ? setLineQty(lines, key, line.qty + delta) : lines
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((line) => lineKey(line) !== key)
}

/** Aceita qualquer coisa vinda do navegador e devolve só linhas válidas, sem repetição. */
export function sanitizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return []
  // Map em vez de addLine: entrada adulterada pode ter milhares de itens (O(n), não O(n²)).
  const lines = new Map<string, CartLine>()
  for (const item of raw) {
    const parsed = lineSchema.safeParse(item)
    if (!parsed.success || parsed.data.qty < 1) continue
    const key = lineKey(parsed.data)
    const existing = lines.get(key)
    if (existing) {
      existing.qty = clampQty(existing.qty + parsed.data.qty)
    } else {
      if (lines.size === MAX_LINES) break
      lines.set(key, { ...parsed.data, qty: clampQty(parsed.data.qty) })
    }
  }
  return [...lines.values()]
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
