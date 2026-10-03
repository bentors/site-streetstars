import type { Metadata } from 'next'
import { Container } from '@/components/ui'
import { SignOutButton } from '@/features/auth/sign-out-button'
import { requireAdmin } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Admin', robots: { index: false } }

// Provisória: o painel completo chega na Fase 5.
export default async function AdminPage() {
  const admin = await requireAdmin()
  return (
    <Container className="flex flex-col gap-6 py-16">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">Painel</h1>
      <p className="font-mono text-xs text-muted">Admin: {admin.email}</p>
      <SignOutButton />
    </Container>
  )
}
