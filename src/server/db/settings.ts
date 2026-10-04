import 'server-only'
import {
  DEFAULT_STORE_SETTINGS,
  storeSettingsSchema,
  type StoreSettings,
} from '@/lib/store-settings'
import { parseDoc } from './convert'
import { db } from './firebase-admin'

/** Campos ausentes vêm dos padrões; documento inválido cai nos padrões em vez de derrubar a loja. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const snapshot = await db().doc('settings/store').get()
  if (!snapshot.exists) return DEFAULT_STORE_SETTINGS
  return (
    parseDoc(storeSettingsSchema, 'settings/store', {
      ...DEFAULT_STORE_SETTINGS,
      ...snapshot.data(),
    }) ?? DEFAULT_STORE_SETTINGS
  )
}
