import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui'
import { requireAdmin } from '@/server/auth/session'
import { listAllCollections } from '@/server/db/collections'

export const metadata: Metadata = { title: 'Coleções' }

export default async function AdminCollectionsPage() {
  await requireAdmin()
  const collections = await listAllCollections()
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/colecoes/novo"
        className="self-start bg-paper px-5 py-3 text-xs font-black tracking-widest text-ink uppercase"
      >
        Nova coleção
      </Link>
      {collections.length === 0 ? (
        <p className="text-xs text-muted">Nenhuma coleção ainda.</p>
      ) : null}
      <ul className="flex flex-col divide-y divide-line border border-line">
        {collections.map((collection) => (
          <li key={collection.id} className="flex items-center gap-4 p-4">
            <span className="w-10 font-mono text-[10px] text-muted">#{collection.order}</span>
            <Link
              href={`/admin/colecoes/${collection.id}`}
              className="flex-1 text-sm font-bold underline"
            >
              {collection.title}
            </Link>
            <Badge tone={collection.status === 'published' ? 'success' : 'neutral'}>
              {collection.status === 'published' ? 'Publicada' : 'Oculta'}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
