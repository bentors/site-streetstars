export const CATEGORIES = ['SUPERIORES', 'INFERIORES', 'ACESSÓRIOS', 'CONJUNTOS'] as const
export type Category = (typeof CATEGORIES)[number]

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const time = (value: Date | string) => new Date(value).getTime()

/** Destaques primeiro (featuredOrder crescente); o resto do mais antigo para o mais novo. */
export function sortForShop<
  T extends { featured: boolean; featuredOrder: number | null; createdAt: Date | string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (a.featured && b.featured) {
      return (
        (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) - (b.featuredOrder ?? Number.MAX_SAFE_INTEGER)
      )
    }
    return time(a.createdAt) - time(b.createdAt)
  })
}
