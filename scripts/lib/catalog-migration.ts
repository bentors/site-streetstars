// Imports relativos: roda tanto no Vitest quanto no tsx, fora do Next.
import { slugify } from '../../src/lib/catalog'
import { productSchema, type ProductDoc } from '../../src/lib/catalog-schemas'
import { cloudinaryPublicId } from '../../src/lib/cloudinary'
import { toCents } from '../../src/lib/money'

export const DEFAULT_PRODUCTION_DAYS = 10

export type LegacyProduct = {
  name: string
  price: number
  description?: string
  category: string
  sizes?: string[]
  colors?: { name: string; hex: string; img?: string | null }[]
  details?: string[]
  features?: string[]
  measurements?: { columns: string[]; rows: { size: string; values: string[] }[] } | null
  img?: string
  gallery?: string[]
  isActive?: boolean
  isFeatured?: boolean
  created_at?: Date
  updated_at?: Date
}

const WEIGHTS: [RegExp, number][] = [
  [/hoodie|moletom/i, 700],
  [/t-?shirt|camiseta/i, 250],
  [/\bcap\b|bon[eé]/i, 150],
  [/beanie|touca/i, 120],
]

export function estimateWeightGrams(name: string): number {
  return WEIGHTS.find(([pattern]) => pattern.test(name))?.[1] ?? 300
}

export function isMigrated(doc: Record<string, unknown>): boolean {
  return typeof doc.priceCents === 'number'
}

export function uniqueSlugs(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((name) => {
    const base = slugify(name)
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return count === 1 ? base : `${base}-${count}`
  })
}

const clean = (items: string[] | undefined) => (items ?? []).map((s) => s.trim()).filter(Boolean)

export function migrateProduct(
  legacy: LegacyProduct,
  context: { slug: string; featuredOrder: number | null; now: Date },
): ProductDoc {
  const urls = [...new Set([legacy.img, ...(legacy.gallery ?? [])].filter((u): u is string => !!u))]
  const details = clean(legacy.details)

  return productSchema.parse({
    slug: context.slug,
    name: legacy.name.trim(),
    description: legacy.description?.trim() ?? '',
    category: legacy.category,
    priceCents: toCents(legacy.price),
    weightGrams: estimateWeightGrams(legacy.name),
    productionDays: DEFAULT_PRODUCTION_DAYS,
    sizes: legacy.sizes ?? [],
    colors: (legacy.colors ?? []).map((color) => ({
      name: color.name,
      hex: color.hex,
      image: color.img ?? null,
    })),
    images: urls.map((url, index) => ({
      url,
      publicId: cloudinaryPublicId(url),
      alt: `${legacy.name.trim()} — foto ${index + 1}`,
    })),
    highlights: details.length > 0 ? details : clean(legacy.features),
    sizeGuide: legacy.measurements ?? null,
    collectionIds: [],
    status: legacy.isActive ? 'active' : 'draft',
    featured: legacy.isFeatured === true,
    featuredOrder: context.featuredOrder,
    createdAt: legacy.created_at ?? context.now,
    updatedAt: context.now,
  })
}
