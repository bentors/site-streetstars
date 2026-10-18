import type { Metadata } from 'next'
import { SettingsForm } from '@/features/admin/settings-form'
import { settingsToForm } from '@/lib/admin-settings'
import { requireAdmin } from '@/server/auth/session'
import { getStoreSettings } from '@/server/db/settings'

export const metadata: Metadata = { title: 'Configurações' }

export default async function AdminSettingsPage() {
  await requireAdmin()
  return <SettingsForm initial={settingsToForm(await getStoreSettings())} />
}
