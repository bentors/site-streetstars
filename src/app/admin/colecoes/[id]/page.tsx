import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CollectionForm } from '@/features/admin/collection-form'
import { collectionToForm } from '@/lib/admin-collection'
import { requireAdmin } from '@/server/auth/session'
import { getCollectionById } from '@/server/db/collections'

export const metadata: Metadata = { title: 'Editar coleção' }

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const collection = await getCollectionById(id)
  if (!collection) notFound()
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/colecoes" className="text-[10px] tracking-widest text-muted uppercase">
        ← Coleções
      </Link>
      <CollectionForm collectionId={collection.id} initial={collectionToForm(collection)} />
    </div>
  )
}
