import { z } from 'zod'

export const storeSettingsSchema = z.object({
  whatsapp: z.string().regex(/^\d*$/),
  email: z.email(),
  instagram: z.string(),
  cnpj: z.string(),
  address: z.string(),
  originCep: z.string().regex(/^(\d{8})?$/),
  package: z.object({
    heightCm: z.number().positive(),
    widthCm: z.number().positive(),
    lengthCm: z.number().positive(),
  }),
})

export type StoreSettings = z.infer<typeof storeSettingsSchema>

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsapp: '',
  email: 'streetstars.company@gmail.com',
  instagram: '@_streetstars.co',
  cnpj: '',
  address: 'São Paulo - SP',
  originCep: '',
  package: { heightCm: 5, widthCm: 30, lengthCm: 30 },
}

export function whatsappUrl(digits: string, message?: string): string | null {
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
