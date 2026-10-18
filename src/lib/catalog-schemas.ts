import { z } from 'zod'
import { CATEGORIES } from './catalog'

export const productImageSchema = z.object({
  url: z.url(),
  publicId: z.string().min(1),
  alt: z.string(),
})

export const productColorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  image: z.url().nullable(),
})

export const sizeGuideSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.object({ size: z.string(), values: z.array(z.string()) })),
})

export const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  description: z.string(),
  category: z.enum(CATEGORIES),
  priceCents: z.number().int().positive(),
  weightGrams: z.number().int().positive(),
  productionDays: z.number().int().min(0),
  sizes: z.array(z.string().min(1)).min(1),
  colors: z.array(productColorSchema),
  images: z.array(productImageSchema).min(1),
  highlights: z.array(z.string()),
  sizeGuide: sizeGuideSchema.nullable(),
  collectionIds: z.array(z.string()),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean(),
  featuredOrder: z.number().int().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const collectionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  shortDescription: z.string(),
  body: z.array(z.string()),
  credits: z.object({ photo: z.string(), direction: z.string(), styling: z.string() }),
  coverImage: z.url(),
  hoverImage: z.url().nullable(),
  gallery: z.array(z.url()),
  status: z.enum(['draft', 'published']),
  order: z.number().int(),
  launchedAt: z.date().nullable(),
})

export type ProductDoc = z.infer<typeof productSchema>
export type ProductColor = z.infer<typeof productColorSchema>
export type SizeGuide = z.infer<typeof sizeGuideSchema>
export type CollectionDoc = z.infer<typeof collectionSchema>
export type ProductImage = z.infer<typeof productImageSchema>
