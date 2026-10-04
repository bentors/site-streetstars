import 'server-only'
import { collectionSchema, type CollectionDoc } from '@/lib/catalog-schemas'
import { zodConverter } from './convert'
import { db } from './firebase-admin'

export type Collection = CollectionDoc & { id: string }

const collections = () =>
  db().collection('collections').withConverter(zodConverter(collectionSchema))

export async function listPublishedCollections(): Promise<Collection[]> {
  const snapshot = await collections().where('status', '==', 'published').get()
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => a.order - b.order)
}

export async function getPublishedCollectionBySlug(slug: string): Promise<Collection | null> {
  const snapshot = await collections()
    .where('status', '==', 'published')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  const doc = snapshot.docs[0]
  return doc ? { id: doc.id, ...doc.data() } : null
}
