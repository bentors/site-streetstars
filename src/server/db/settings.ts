import 'server-only'
import {
  DEFAULT_STORE_SETTINGS,
  storeSettingsSchema,
  type StoreSettings,
} from '@/lib/store-settings'
import { zodConverter } from './convert'
import { db } from './firebase-admin'

export async function getStoreSettings(): Promise<StoreSettings> {
  const snapshot = await db()
    .doc('settings/store')
    .withConverter(zodConverter(storeSettingsSchema))
    .get()
  return snapshot.data() ?? DEFAULT_STORE_SETTINGS
}
