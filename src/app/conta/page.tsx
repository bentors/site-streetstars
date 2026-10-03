import type { Metadata } from 'next'
import { Container } from '@/components/ui'
import { SignOutButton } from '@/features/auth/sign-out-button'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Minha conta', robots: { index: false } }

// Provisória: a área do cliente completa chega na Fase 4.
export default async function AccountPage() {
  const user = await requireUser('/conta')
  return (
    <Container className="flex flex-col gap-6 py-16">
      <h1 className="text-2xl font-black tracking-tighter uppercase italic">Minha conta</h1>
      <p className="font-mono text-xs text-muted">{user.email}</p>
      <SignOutButton />
    </Container>
  )
}
