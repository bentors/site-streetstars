import { z } from 'zod'
import { isValidCep, normalizeCep } from './cep'
import type { StoreSettings } from './store-settings'

export type SettingsFormValues = {
  whatsapp: string
  email: string
  instagram: string
  cnpj: string
  address: string
  originCep: string
  heightCm: string
  widthCm: string
  lengthCm: string
}

const digits = (text: string) => text.replace(/\D/g, '')
const centimeters = z
  .string()
  .trim()
  .transform((text) => Number(text.replace(',', '.')))
  .refine((n) => Number.isFinite(n) && n > 0, 'Medida inválida')

export const settingsFormSchema = z
  .object({
    // wa.me precisa do DDI: sem o 55, "11 9…" vira um número dos EUA.
    whatsapp: z
      .string()
      .transform(digits)
      .transform((d) => (d.length === 10 || d.length === 11 ? `55${d}` : d))
      .refine((d) => d === '' || /^55\d{10,11}$/.test(d), 'Use DDD + número, ex.: 11 98765-4321'),
    email: z.string().trim().toLowerCase().pipe(z.email('E-mail inválido')),
    instagram: z.string().trim().max(60, 'Muito longo'),
    cnpj: z.string().transform(digits),
    address: z.string().trim().max(200, 'Muito longo'),
    originCep: z
      .string()
      .transform(normalizeCep)
      .refine((cep) => cep === '' || isValidCep(cep), 'CEP inválido'),
    heightCm: centimeters,
    widthCm: centimeters,
    lengthCm: centimeters,
  })
  .transform(({ heightCm, widthCm, lengthCm, ...rest }): StoreSettings => ({
    ...rest,
    package: { heightCm, widthCm, lengthCm },
  }))

export function settingsToForm(settings: StoreSettings): SettingsFormValues {
  return {
    whatsapp: settings.whatsapp,
    email: settings.email,
    instagram: settings.instagram,
    cnpj: settings.cnpj,
    address: settings.address,
    originCep: settings.originCep,
    heightCm: String(settings.package.heightCm),
    widthCm: String(settings.package.widthCm),
    lengthCm: String(settings.package.lengthCm),
  }
}
