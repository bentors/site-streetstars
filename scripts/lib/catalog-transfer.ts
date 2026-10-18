// Imports relativos: roda no Vitest e no tsx, fora do Next.
const ALLOWED = ['products', 'collections', 'settings'] as const
type Allowed = (typeof ALLOWED)[number]
export type CatalogDoc = { collection: Allowed; id: string; data: Record<string, unknown> }

function encode(value: unknown): unknown {
  if (value instanceof Date) return { __date: value.toISOString() }
  if (Array.isArray(value)) return value.map(encode)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]))
  }
  return value
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.__date === 'string') return new Date(record.__date)
    return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, decode(v)]))
  }
  return value
}

export function serializeCatalog(
  docs: { collection: string; id: string; data: unknown }[],
): string {
  return JSON.stringify(
    docs.map((doc) => ({ ...doc, data: encode(doc.data) })),
    null,
    2,
  )
}

/** Só catálogo (nunca pedidos ou usuários) e ids que não viram caminho no Firestore. */
export function parseCatalog(json: string): CatalogDoc[] {
  const raw = JSON.parse(json) as { collection: string; id: string; data: unknown }[]
  return raw.map((doc) => {
    if (!ALLOWED.includes(doc.collection as Allowed) || !/^[A-Za-z0-9_-]{1,128}$/.test(doc.id)) {
      throw new Error(`Documento fora do catálogo: ${doc.collection}/${doc.id}`)
    }
    return {
      collection: doc.collection as Allowed,
      id: doc.id,
      data: decode(doc.data) as Record<string, unknown>,
    }
  })
}
