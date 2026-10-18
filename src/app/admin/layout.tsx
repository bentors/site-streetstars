import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui'
import { AdminNav } from '@/features/admin/admin-nav'
import { SignOutButton } from '@/features/auth/sign-out-button'
import { requireAdmin } from '@/server/auth/session'
import { listUnseenPaidOrders } from '@/server/db/orders'

export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Layout não roda de novo na navegação do cliente: cada página e action chama requireAdmin.
  const admin = await requireAdmin()
  const unseen = (await listUnseenPaidOrders()).length
  return (
    <Container className="flex flex-col gap-8 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/admin" className="text-2xl font-black tracking-tighter uppercase italic">
            Painel Street Stars
          </Link>
          <p className="font-mono text-[10px] text-muted">{admin.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[10px] tracking-widest text-muted uppercase underline">
            Ver loja
          </Link>
          <SignOutButton />
        </div>
      </header>
      <AdminNav unseen={unseen} />
      {children}
    </Container>
  )
}
