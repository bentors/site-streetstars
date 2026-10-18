import { z } from 'zod'

const optionalNote = z
  .string()
  .trim()
  .max(500, 'Muito longo')
  .optional()
  .transform((note) => note || undefined)
const requiredNote = z.string().trim().min(1, 'Descreva o motivo.').max(500, 'Muito longo')

export const adminTransitionSchema = z.discriminatedUnion('to', [
  z.object({ to: z.literal('in_production'), note: optionalNote }),
  z.object({
    to: z.literal('shipped'),
    trackingCode: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, 'Informe o código de rastreio.')
      .regex(/^[A-Z0-9]{8,30}$/, 'Código de rastreio inválido.'),
    note: optionalNote,
  }),
  z.object({ to: z.literal('delivered'), note: optionalNote }),
  z.object({ to: z.literal('cancelled'), note: requiredNote }),
  z.object({ to: z.literal('refunded'), note: requiredNote }),
])

export type AdminTransition = z.output<typeof adminTransitionSchema>
