import type { Metadata } from 'next'
import { AddressBook } from '@/features/account/address-book'
import { requireUser } from '@/server/auth/session'
import { getUser } from '@/server/db/users'

export const metadata: Metadata = { title: 'Endereços' }

export default async function AccountAddressesPage() {
  const user = await requireUser('/conta/enderecos')
  const profile = await getUser(user.uid)
  return <AddressBook addresses={profile?.addresses ?? []} />
}
