'use server'

import { updateTag } from 'next/cache'
import type { z } from 'zod'
import { collectionFormSchema } from '@/lib/admin-collection'
import { productFormSchema } from '@/lib/admin-product'
import { fail, type Result } from '@/lib/result'
import { requireAdmin } from '@/server/auth/session'
import { CATALOG_TAG } from '@/server/catalog'
import { saveCollection } from '@/server/db/collections'
import { saveProduct, setProductFeatured, setProductStatus } from '@/server/db/products'

const isId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9]{1,64}$/.test(value)
const BAD = fail('invalid_input', 'Requisição inválida.')

/** O código leva o campo (`invalid_input:price`) para o formulário marcar o input certo. */
function invalid(error: z.ZodError) {
  const issue = error.issues[0]
  const field = typeof issue?.path[0] === 'string' ? `:${issue.path[0]}` : ''
  return fail(`invalid_input${field}`, issue?.message ?? 'Confira os dados.')
}

function refreshed<T>(result: Result<T>): Result<T> {
  // Vitrine na hora: invalida o cache do catálogo para quem abrir a loja a seguir.
  if (result.ok) updateTag(CATALOG_TAG)
  return result
}

export async function saveProductAction(
  id: string | null,
  values: unknown,
): Promise<Result<{ id: string }>> {
  await requireAdmin()
  if (id !== null && !isId(id)) return BAD
  const parsed = productFormSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error)
  return refreshed(await saveProduct(id, parsed.data, new Date()))
}

const STATUSES = ['draft', 'active', 'archived'] as const
type Status = (typeof STATUSES)[number]
const isStatus = (value: unknown): value is Status => STATUSES.includes(value as Status)

export async function setProductStatusAction(id: string, status: unknown): Promise<Result<null>> {
  await requireAdmin()
  if (!isId(id) || !isStatus(status)) return BAD
  return refreshed(await setProductStatus(id, status, new Date()))
}

export async function setProductFeaturedAction(
  id: string,
  featured: unknown,
  order: unknown,
): Promise<Result<null>> {
  await requireAdmin()
  if (!isId(id) || typeof featured !== 'boolean') return BAD
  if (featured && !Number.isSafeInteger(order)) return BAD
  return refreshed(
    await setProductFeatured(id, featured, featured ? (order as number) : null, new Date()),
  )
}

export async function saveCollectionAction(
  id: string | null,
  values: unknown,
): Promise<Result<{ id: string }>> {
  await requireAdmin()
  if (id !== null && !isId(id)) return BAD
  const parsed = collectionFormSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error)
  return refreshed(await saveCollection(id, parsed.data))
}
