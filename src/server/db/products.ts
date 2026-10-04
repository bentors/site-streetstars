import 'server-only'
import { productSchema, type ProductDoc } from '@/lib/catalog-schemas'
import { zodConverter } from './convert'
import { db } from './firebase-admin'

export type Product = ProductDoc & { id: string }

const products = () => db().collection('products').withConverter(zodConverter(productSchema))

export async function listActiveProducts(): Promise<Product[]> {
  const snapshot = await products().where('status', '==', 'active').get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const snapshot = await products()
    .where('status', '==', 'active')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  const doc = snapshot.docs[0]
  return doc ? { id: doc.id, ...doc.data() } : null
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return []
  const snapshots = await db().getAll(...unique.map((id) => products().doc(id)))
  return snapshots.flatMap((snapshot) => {
    // getAll não é genérico na tipagem, mas aplica o converter de cada referência.
    const data = snapshot.data() as ProductDoc | undefined
    return data ? [{ id: snapshot.id, ...data }] : []
  })
}
