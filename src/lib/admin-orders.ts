import { z } from 'zod'

const optionalNote = z
  .string()
  .trim()
  .max(500, 'Muito longo')
  .transform((note) => note || undefined)
  .optional()
const requiredNote = z.string().trim().min(1, 'Descreva o motivo.').max(500, 'Muito longo')

export const trackingCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Informe o código de rastreio.')
  .regex(/^[A-Z0-9]{8,30}$/, 'Código de rastreio inválido.')

export const adminTransitionSchema = z.discriminatedUnion('to', [
  z.object({ to: z.literal('in_production'), note: optionalNote }),
  z.object({
    to: z.literal('shipped'),
    trackingCode: trackingCodeSchema,
    note: optionalNote,
  }),
  z.object({ to: z.literal('delivered'), note: optionalNote }),
  z.object({ to: z.literal('cancelled'), note: requiredNote }),
  z.object({ to: z.literal('refunded'), note: requiredNote }),
])

export type AdminTransition = z.output<typeof adminTransitionSchema>
