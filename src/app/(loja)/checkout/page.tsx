import type { Metadata } from 'next'
import { Container } from '@/components/ui'
import { CheckoutForm, type CheckoutDefaults } from '@/features/checkout/checkout-form'
import { getSessionUser } from '@/server/auth/session'
import { getUser } from '@/server/db/users'

export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } }

export default async function CheckoutPage() {
  const session = await getSessionUser()
  const profile = session ? await getUser(session.uid) : null
  const defaults: CheckoutDefaults = {
    email: session?.email ?? '',
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    cpf: profile?.cpf ?? '',
  }

  return (
    <div className="pt-28 pb-20">
      <Container className="flex flex-col gap-10">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-4xl">
          Finalizar compra
        </h1>
        <CheckoutForm defaults={defaults} />
      </Container>
    </div>
  )
}
