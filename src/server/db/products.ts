import 'server-only'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { productSchema, type ProductDoc } from '@/lib/catalog-schemas'
import { parseDoc } from './convert'
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
