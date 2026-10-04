import 'server-only'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { collectionSchema, type CollectionDoc } from '@/lib/catalog-schemas'
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
