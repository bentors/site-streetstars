import type { Metadata } from 'next'
import { CollectionForm } from '@/features/admin/collection-form'
import { collectionToForm } from '@/lib/admin-collection'
import { requireAdmin } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Nova coleção' }

export default async function NewCollectionPage() {
  await requireAdmin()
  return <CollectionForm collectionId={null} initial={collectionToForm(null)} />
}
