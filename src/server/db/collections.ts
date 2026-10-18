import 'server-only'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { collectionSchema, type CollectionDoc } from '@/lib/catalog-schemas'
import { fail, ok, type Result } from '@/lib/result'
import { parseDoc } from './convert'
import { db } from './firebase-admin'

export type Collection = CollectionDoc & { id: string }

const collections = () => db().collection('collections')

function toCollection(snapshot: DocumentSnapshot): Collection[] {
  const data = parseDoc(collectionSchema, snapshot.ref.path, snapshot.data())
  return data ? [{ id: snapshot.id, ...data }] : []
}

export async function listPublishedCollections(): Promise<Collection[]> {
  const snapshot = await collections().where('status', '==', 'published').get()
  return snapshot.docs.flatMap(toCollection).sort((a, b) => a.order - b.order)
}

export async function getPublishedCollectionBySlug(slug: string): Promise<Collection | null> {
  const snapshot = await collections()
    .where('status', '==', 'published')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  return snapshot.docs.flatMap(toCollection)[0] ?? null
}

export async function listAllCollections(): Promise<Collection[]> {
  const snapshot = await collections().get()
  return snapshot.docs.flatMap(toCollection).sort((a, b) => a.order - b.order)
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  const snapshot = await collections().doc(id).get()
  return snapshot.exists ? (toCollection(snapshot)[0] ?? null) : null
}

export async function saveCollection(
  id: string | null,
  input: CollectionDoc,
): Promise<Result<{ id: string }>> {
  const clash = await collections().where('slug', '==', input.slug).limit(2).get()
  if (clash.docs.some((doc) => doc.id !== id)) {
    return fail('slug_taken', 'Já existe uma coleção com esse endereço (slug).')
  }
  const doc = collectionSchema.parse(input)
  if (id === null) {
    const ref = collections().doc()
    await ref.create(doc)
    return ok({ id: ref.id })
  }
  const ref = collections().doc(id)
  return db().runTransaction(async (tx) => {
    if (!(await tx.get(ref)).exists) return fail('not_found', 'Coleção não encontrada.')
    tx.set(ref, doc)
    return ok({ id })
  })
}
