import * as privacidade from '@/content/legal/politica-de-privacidade'
import * as termos from '@/content/legal/termos-de-uso'
import * as trocas from '@/content/legal/trocas-e-devolucoes'
import { whatsappUrl, type StoreSettings } from './store-settings'

export const LEGAL_PAGES = {
  'termos-de-uso': termos,
  'politica-de-privacidade': privacidade,
  'trocas-e-devolucoes': trocas,
} as const

export type LegalSlug = keyof typeof LEGAL_PAGES

export function isLegalSlug(value: string): value is LegalSlug {
  return Object.hasOwn(LEGAL_PAGES, value)
}

const MISSING = 'a informar'

export function fillLegalText(text: string, settings: StoreSettings, siteHost: string): string {
  const values: Record<string, string> = {
    whatsapp: whatsappUrl(settings.whatsapp) ?? MISSING,
    email: settings.email || MISSING,
    cnpj: settings.cnpj || MISSING,
    instagram: settings.instagram || MISSING,
    siteHost,
  }
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match)
}
