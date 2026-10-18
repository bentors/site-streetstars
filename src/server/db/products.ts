import 'server-only'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import type { ProductInput } from '@/lib/admin-product'
import { productSchema, type ProductDoc } from '@/lib/catalog-schemas'
import { fail, ok, type Result } from '@/lib/result'
import { parseDoc, timestampsToDates } from './convert'
import { db } from './firebase-admin'

export type Product = ProductDoc & { id: string }

const products = () => db().collection('products')

function toProduct(snapshot: DocumentSnapshot): Product[] {
  if (!snapshot.exists) return []
  const data = parseDoc(productSchema, snapshot.ref.path, snapshot.data())
  return data ? [{ id: snapshot.id, ...data }] : []
}

export async function listActiveProducts(): Promise<Product[]> {
  const snapshot = await products().where('status', '==', 'active').get()
  return snapshot.docs.flatMap(toProduct)
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const snapshot = await products()
    .where('status', '==', 'active')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  return snapshot.docs.flatMap(toProduct)[0] ?? null
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return []
  const snapshots = await db().getAll(...unique.map((id) => products().doc(id)))
  return snapshots.flatMap(toProduct)
}

const SLUG_TAKEN = fail('slug_taken', 'Já existe um produto com esse endereço (slug).')
const NOT_FOUND = fail('not_found', 'Produto não encontrado.')

export async function listAllProducts(): Promise<Product[]> {
  const snapshot = await products().get()
  return snapshot.docs
    .flatMap(toProduct)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function getProductById(id: string): Promise<Product | null> {
  return toProduct(await products().doc(id).get())[0] ?? null
}

async function slugTaken(slug: string, id: string | null): Promise<boolean> {
  const snapshot = await products().where('slug', '==', slug).limit(2).get()
  return snapshot.docs.some((doc) => doc.id !== id)
}

/** Lê, aplica e valida o documento inteiro: produto gravado nunca é descartado pela vitrine. */
async function mutateProduct(
  id: string,
  patch: (current: ProductDoc) => Partial<ProductDoc>,
  now: Date,
): Promise<Result<null>> {
  const ref = products().doc(id)
  return db().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref)
    if (!snapshot.exists) return NOT_FOUND
    // Sem parse aqui: um documento antigo fora do schema pode ser corrigido pelo próprio formulário.
    const base = timestampsToDates(snapshot.data()) as ProductDoc
    tx.set(ref, productSchema.parse({ ...base, ...patch(base), updatedAt: now }))
    return ok(null)
  })
}

export async function saveProduct(
  id: string | null,
  input: ProductInput,
  now: Date,
): Promise<Result<{ id: string }>> {
  // ponytail: slug conferido fora da transação; dois admins salvando o mesmo slug no mesmo
  // instante poderiam duplicar. Loja com um admin; se crescer, guardar slugs em slugs/{slug}.
  if (await slugTaken(input.slug, id)) return SLUG_TAKEN
  if (id === null) {
    const ref = products().doc()
    await ref.create(
      productSchema.parse({
        ...input,
        featured: false,
        featuredOrder: null,
        createdAt: now,
        updatedAt: now,
      }),
    )
    return ok({ id: ref.id })
  }
  const saved = await mutateProduct(id, () => input, now)
  return saved.ok ? ok({ id }) : saved
}

export function setProductStatus(id: string, status: ProductDoc['status'], now: Date) {
  return mutateProduct(id, () => ({ status }), now)
}

export function setProductFeatured(
  id: string,
  featured: boolean,
  featuredOrder: number | null,
  now: Date,
) {
  return mutateProduct(
    id,
    () => ({ featured, featuredOrder: featured ? featuredOrder : null }),
    now,
  )
}
