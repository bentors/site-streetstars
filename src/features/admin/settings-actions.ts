'use server'

import { updateTag } from 'next/cache'
import { settingsFormSchema } from '@/lib/admin-settings'
import { fail, ok, type Result } from '@/lib/result'
import { requireAdmin } from '@/server/auth/session'
import { CATALOG_TAG } from '@/server/catalog'
import { saveStoreSettings } from '@/server/db/settings'

export async function updateSettingsAction(values: unknown): Promise<Result<null>> {
  await requireAdmin()
  const parsed = settingsFormSchema.safeParse(values)
  if (!parsed.success) {
    return fail('invalid_input', parsed.error.issues[0]?.message ?? 'Confira os dados.')
  }
  await saveStoreSettings(parsed.data)
  // Rodapé, WhatsApp e páginas legais leem settings/store pelo cache do catálogo.
  updateTag(CATALOG_TAG)
  return ok(null)
}
