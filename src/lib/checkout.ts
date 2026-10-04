import { z } from 'zod'
import { isValidCep, normalizeCep } from './cep'
import { isValidCpf, normalizeCpf } from './cpf'
import { isValidPhone, normalizePhone } from './phone'

const text = (max: number) => z.string().trim().min(1, 'Obrigatório').max(max, 'Muito longo')

export const checkoutCustomerSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('E-mail inválido')),
  name: text(80),
  phone: z.string().transform(normalizePhone).refine(isValidPhone, 'Telefone inválido'),
  cpf: z.string().transform(normalizeCpf).refine(isValidCpf, 'CPF inválido'),
})

export const checkoutAddressSchema = z.object({
  cep: z.string().transform(normalizeCep).refine(isValidCep, 'CEP inválido'),
  street: text(120),
  number: text(20),
  complement: z.string().trim().max(60, 'Muito longo'),
  neighborhood: text(80),
  city: text(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'UF inválida'),
})

export const createOrderInputSchema = z.object({
  idempotencyKey: z.uuid(),
  /** Linhas cruas do localStorage: o servidor sanitiza e precifica. */
  lines: z.unknown(),
  customer: checkoutCustomerSchema,
  address: checkoutAddressSchema,
  serviceId: z.number().int().positive(),
  couponCode: z.string().trim().max(32).nullable(),
})

export type CreateOrderInput = z.input<typeof createOrderInputSchema>

export type ShippingOption = {
  serviceId: number
  name: string
  company: string
  priceCents: number
  deliveryDays: number
  productionDays: number
  /** Prazo exibido: produção + entrega, em dias úteis. */
  totalDays: number
}
