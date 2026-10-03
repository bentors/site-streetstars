import 'server-only'
import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import type { z } from 'zod'

export function timestampsToDates(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(timestampsToDates)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, timestampsToDates(inner)]),
    )
  }
  return value
}

/** Valida todo documento lido com o schema zod; Dates são gravadas como Timestamps. */
export function zodConverter<T extends DocumentData>(
  schema: z.ZodType<T>,
): FirestoreDataConverter<T> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snapshot: QueryDocumentSnapshot) =>
      schema.parse(timestampsToDates(snapshot.data())),
  }
}
