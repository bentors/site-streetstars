import { z } from 'zod'
import { CATEGORIES, slugify } from './catalog'
import {
  productColorSchema,
  productImageSchema,
  type ProductColor,
  type ProductDoc,
  type ProductImage,
  type SizeGuide,
} from './catalog-schemas'
import { MAX_COLOR_LENGTH, MAX_SIZE_LENGTH } from './cart'
import { formatCentsInput, parseReaisToCents } from './money'

export type ProductInput = Omit<
  ProductDoc,
  'featured' | 'featuredOrder' | 'createdAt' | 'updatedAt'
>

export type ProductFormValues = {
  name: string
  slug: string
  description: string
  category: string
  price: string
  weightGrams: string
  productionDays: string
  sizes: string
  colors: ProductColor[]
  images: ProductImage[]
  highlights: string
  sizeGuide: string
  collectionIds: string[]
  status: 'draft' | 'active' | 'archived'
}

const cells = (line: string) => line.split(';').map((cell) => cell.trim())

/** 1ª linha = colunas (a primeira é o tamanho); depois uma linha por tamanho. */
export function parseSizeGuide(text: string): SizeGuide | null | 'invalid' {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  const [header = '', ...body] = lines
  const columns = cells(header)
  if (body.length === 0 || columns.length < 2) return 'invalid'
  const rows = body.map(cells)
  if (rows.some((row) => row.length !== columns.length || row.some((cell) => !cell))) {
    return 'invalid'
  }
  return { columns, rows: rows.map(([size = '', ...values]) => ({ size, values })) }
}

export function formatSizeGuide(guide: SizeGuide | null): string {
  if (!guide) return ''
  return [
    guide.columns.join('; '),
    ...guide.rows.map((row) => [row.size, ...row.values].join('; ')),
  ].join('\n')
}

const positiveInt = (message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, message)
    .transform(Number)
    .refine((n) => n > 0, message)

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Obrigatório').max(80, 'Muito longo'),
    slug: z.string().trim(),
    description: z.string().trim().max(2000, 'Muito longo'),
    category: z.enum(CATEGORIES, { error: 'Categoria inválida' }),
    price: z
      .string()
      .transform((text) => parseReaisToCents(text))
      .refine((cents) => cents !== null && cents > 0, 'Preço inválido'),
    weightGrams: positiveInt('Peso inválido'),
    productionDays: z.string().trim().regex(/^\d+$/, 'Prazo inválido').transform(Number),
    sizes: z
      .string()
      .transform((text) => [
        ...new Set(
          text
            .split(',')
            .map((size) => size.trim())
            .filter(Boolean),
        ),
      ])
      .refine((sizes) => sizes.length > 0, 'Informe ao menos um tamanho')
      .refine(
        (sizes) => sizes.every((size) => size.length <= MAX_SIZE_LENGTH),
        'Tamanho com até 20 caracteres',
      ),
    // A sacola descarta nomes maiores, e cores com o mesmo nome não se distinguem nela.
    colors: z
      .array(productColorSchema)
      .refine(
        (colors) => colors.every((c) => c.name.trim().length <= MAX_COLOR_LENGTH),
        'Nome da cor com até 40 caracteres',
      )
      .refine(
        (colors) => new Set(colors.map((c) => c.name.trim().toLowerCase())).size === colors.length,
        'Cada cor precisa de um nome diferente',
      ),
    images: z.array(productImageSchema).min(1, 'Adicione ao menos uma foto'),
    highlights: z.string().transform(lines),
    sizeGuide: z
      .string()
      .transform(parseSizeGuide)
      .refine((guide) => guide !== 'invalid', 'Guia de medidas inválido')
      .transform((guide) => (guide === 'invalid' ? null : guide)),
    collectionIds: z.array(z.string().min(1)),
    status: z.enum(['draft', 'active', 'archived']),
  })
  // O slug sai do nome quando vazio; a checagem do formato vem depois, para o erro cair no campo slug.
  .transform(({ price, slug, ...form }): ProductInput => ({
    ...form,
    slug: slug || slugify(form.name),
    priceCents: price as number,
  }))
  .refine((product) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug), {
    path: ['slug'],
    message: 'Use só letras minúsculas, números e hífens',
  })

export function productToForm(product: ProductDoc | null): ProductFormValues {
  if (!product) {
    return {
      name: '',
      slug: '',
      description: '',
      category: CATEGORIES[0],
      price: '',
      weightGrams: '',
      productionDays: '10',
      sizes: '',
      colors: [],
      images: [],
      highlights: '',
      sizeGuide: '',
      collectionIds: [],
      status: 'draft',
    }
  }
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    price: formatCentsInput(product.priceCents),
    weightGrams: String(product.weightGrams),
    productionDays: String(product.productionDays),
    sizes: product.sizes.join(', '),
    colors: product.colors,
    images: product.images,
    highlights: product.highlights.join('\n'),
    sizeGuide: formatSizeGuide(product.sizeGuide),
    collectionIds: product.collectionIds,
    status: product.status,
  }
}
