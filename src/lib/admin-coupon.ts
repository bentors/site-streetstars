import { z } from 'zod'
import { fromSaoPauloInput, toSaoPauloInput } from './format-date'
import { formatCentsInput, parseReaisToCents } from './money'

export type CouponFormValues = {
  code: string
  type: 'percent' | 'fixed'
  value: string
  minSubtotal: string
  startsAt: string
  endsAt: string
  maxUses: string
  active: boolean
}

type CouponLike = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotalCents: number | null
  startsAt: Date | null
  endsAt: Date | null
  maxUses: number | null
  active: boolean
}

const optionalCents = z
  .string()
  .trim()
  .transform((text) => (text ? parseReaisToCents(text) : null))
  .refine((cents) => cents === null || cents >= 0, 'Valor inválido')
const optionalDate = z
  .string()
  .refine((text) => !text.trim() || fromSaoPauloInput(text) !== null, 'Data inválida')
  .transform((text) => fromSaoPauloInput(text))
const optionalUses = z
  .string()
  .trim()
  .refine((text) => !text || /^[1-9]\d*$/.test(text), 'Use um número maior que zero')
  .transform((text) => (text ? Number(text) : null))

const validity = {
  minSubtotal: optionalCents,
  startsAt: optionalDate,
  endsAt: optionalDate,
  maxUses: optionalUses,
  active: z.boolean(),
}

const endsAfterStart = (c: { startsAt: Date | null; endsAt: Date | null }) =>
  !c.startsAt || !c.endsAt || c.endsAt > c.startsAt
const ENDS = { path: ['endsAt'], message: 'O fim precisa ser depois do início' }

/** Edição: só validade, limite, pedido mínimo e ativo (tipo, valor e usos não mudam). */
export const couponUpdateSchema = z
  .object(validity)
  .refine(endsAfterStart, ENDS)
  .transform(({ minSubtotal, ...rest }) => ({ minSubtotalCents: minSubtotal, ...rest }))

export type CouponUpdate = z.output<typeof couponUpdateSchema>

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{1,32}$/, 'Use letras, números, _ ou - (até 32)'),
    type: z.enum(['percent', 'fixed']),
    value: z.string().trim(),
    ...validity,
  })
  .transform((form, ctx) => {
    const value =
      form.type === 'percent'
        ? /^\d+$/.test(form.value)
          ? Number(form.value)
          : null
        : parseReaisToCents(form.value)
    const max = form.type === 'percent' ? 100 : Number.MAX_SAFE_INTEGER
    if (value === null || value < 1 || value > max) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: form.type === 'percent' ? 'Percentual entre 1 e 100' : 'Valor inválido',
      })
      return z.NEVER
    }
    const { minSubtotal, ...rest } = form
    return { ...rest, value, minSubtotalCents: minSubtotal }
  })
  .refine(endsAfterStart, ENDS)

export function couponToForm(coupon: CouponLike | null): CouponFormValues {
  if (!coupon) {
    return {
      code: '',
      type: 'percent',
      value: '',
      minSubtotal: '',
      startsAt: '',
      endsAt: '',
      maxUses: '',
      active: true,
    }
  }
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.type === 'percent' ? String(coupon.value) : formatCentsInput(coupon.value),
    minSubtotal: coupon.minSubtotalCents === null ? '' : formatCentsInput(coupon.minSubtotalCents),
    startsAt: toSaoPauloInput(coupon.startsAt, true),
    endsAt: toSaoPauloInput(coupon.endsAt, true),
    maxUses: coupon.maxUses === null ? '' : String(coupon.maxUses),
    active: coupon.active,
  }
}
