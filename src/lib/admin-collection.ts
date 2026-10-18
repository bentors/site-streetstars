import { z } from 'zod'
import { slugify } from './catalog'
import type { CollectionDoc } from './catalog-schemas'
import { fromSaoPauloInput, toSaoPauloInput } from './format-date'

export type CollectionFormValues = {
  slug: string
  title: string
  shortDescription: string
  body: string
  photo: string
  direction: string
  styling: string
  coverImage: string
  hoverImage: string
  gallery: string[]
  status: 'draft' | 'published'
  order: string
  launchedAt: string
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const short = (max: number) => z.string().trim().max(max, 'Muito longo')

export const collectionFormSchema = z
  .object({
    slug: z.string().trim(),
    title: z.string().trim().min(1, 'Obrigatório').max(80, 'Muito longo'),
    shortDescription: short(200),
    body: z.string().transform((text) =>
      text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    ),
    photo: short(80),
    direction: short(80),
    styling: short(80),
    coverImage: z.string().min(1, 'Adicione a capa').pipe(z.url('Adicione a capa')),
    hoverImage: z
      .string()
      .transform((url) => url || null)
      .pipe(z.url().nullable()),
    gallery: z.array(z.url()),
    status: z.enum(['draft', 'published']),
    order: z
      .string()
      .trim()
      .regex(/^-?\d+$/, 'Ordem inválida')
      .transform(Number),
    launchedAt: z.string().transform(fromSaoPauloInput),
  })
  .transform((form): CollectionDoc => ({
    slug: form.slug || slugify(form.title),
    title: form.title,
    shortDescription: form.shortDescription,
    body: form.body,
    credits: { photo: form.photo, direction: form.direction, styling: form.styling },
    coverImage: form.coverImage,
    hoverImage: form.hoverImage,
    gallery: form.gallery,
    status: form.status,
    order: form.order,
    launchedAt: form.launchedAt,
  }))
  .refine((doc) => SLUG.test(doc.slug), {
    path: ['slug'],
    message: 'Use só letras minúsculas, números e hífens',
  })

export function collectionToForm(collection: CollectionDoc | null): CollectionFormValues {
  return {
    slug: collection?.slug ?? '',
    title: collection?.title ?? '',
    shortDescription: collection?.shortDescription ?? '',
    body: collection?.body.join('\n\n') ?? '',
    photo: collection?.credits.photo ?? '',
    direction: collection?.credits.direction ?? '',
    styling: collection?.credits.styling ?? '',
    coverImage: collection?.coverImage ?? '',
    hoverImage: collection?.hoverImage ?? '',
    gallery: collection?.gallery ?? [],
    status: collection?.status ?? 'draft',
    order: String(collection?.order ?? 0),
    launchedAt: toSaoPauloInput(collection?.launchedAt ?? null, false),
  }
}
