import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProfileForm } from '@/features/account/profile-form'
import { requireUser } from '@/server/auth/session'
import { getUser } from '@/server/db/users'

export const metadata: Metadata = { title: 'Perfil' }

export default async function AccountProfilePage() {
  const user = await requireUser('/conta/perfil')
  // createSession sempre cria o perfil; sem ele, algo foi apagado à mão.
  const profile = await getUser(user.uid)
  if (!profile) notFound()
  return (
    <ProfileForm
      initial={{
        name: profile.name,
        phone: profile.phone ?? '',
        cpf: profile.cpf ?? '',
        marketingConsent: profile.marketingConsent.value,
      }}
    />
  )
}
