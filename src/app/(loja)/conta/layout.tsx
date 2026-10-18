import type { Metadata } from 'next'
import { Container } from '@/components/ui'
import { AccountNav } from '@/features/account/account-nav'
import { VerifyEmailNotice } from '@/features/account/verify-email-notice'
import { SignOutButton } from '@/features/auth/sign-out-button'
import { requireUser } from '@/server/auth/session'

// O layout raiz já aplica '%s | Street Stars'; um template aqui o substituiria.
export const metadata: Metadata = { title: 'Minha conta', robots: { index: false, follow: false } }

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Layout não roda de novo na navegação do cliente: cada página também chama requireUser.
  const user = await requireUser('/conta')
  return (
    <div className="pt-28 pb-20">
      <Container className="flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-4xl">
              Minha conta
            </h1>
            <p className="font-mono text-xs text-muted">{user.email}</p>
          </div>
          <SignOutButton />
        </header>
        {user.emailVerified ? null : <VerifyEmailNotice email={user.email} />}
        <AccountNav />
        {children}
      </Container>
    </div>
  )
}
