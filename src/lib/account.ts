import { z } from 'zod'
import { checkoutAddressSchema } from './checkout'
import { isValidCpf, normalizeCpf } from './cpf'
import { isValidPhone, normalizePhone } from './phone'

export const MAX_ADDRESSES = 10

/** Regra da spec: 8+ caracteres com letra e número. Devolve a mensagem do problema ou null. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use pelo menos 8 caracteres.'
  if (password.length > 128) return 'Senha muito longa.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use letras e números.'
  return null
}

const name = z.string().trim().min(1, 'Obrigatório').max(80, 'Muito longo')

/** Campo opcional só de dígitos: vazio vira null, preenchido precisa ser válido. */
const optionalDigits = (
  normalize: (input: string) => string,
  isValid: (input: string) => boolean,
  message: string,
) =>
  z
    .string()
    .transform(normalize)
    .refine((value) => value === '' || isValid(value), message)
    .transform((value) => value || null)

export const signUpSchema = z.object({
  name,
  marketingConsent: z.boolean(),
  acceptTerms: z.literal(true, { error: 'Aceite os termos para continuar.' }),
})
export type SignUpInput = z.output<typeof signUpSchema>

export const profileSchema = z.object({
  name,
  phone: optionalDigits(normalizePhone, isValidPhone, 'Telefone inválido'),
  cpf: optionalDigits(normalizeCpf, isValidCpf, 'CPF inválido'),
  marketingConsent: z.boolean(),
})
export type ProfileInput = z.output<typeof profileSchema>

export const addressInputSchema = checkoutAddressSchema.extend({
  label: z.string().trim().max(30, 'Muito longo'),
  isDefault: z.boolean(),
})
export type AddressInput = z.output<typeof addressInputSchema>
export type SavedAddress = AddressInput & { id: string }
