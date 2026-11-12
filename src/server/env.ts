import 'server-only'
import { z } from 'zod'
import { parseEnv } from '@/lib/env'

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_CLIENT_EMAIL: z.string().min(1).optional(),
    FIREBASE_PRIVATE_KEY: z
      .string()
      .min(1)
      .optional()
      .transform((key) => key?.replace(/\\n/g, '\n')),
    FIRESTORE_EMULATOR_HOST: z.string().min(1).optional(),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
    ORDER_TOKEN_SECRET: z.string().min(32),
    MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
    MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
    MELHORENVIO_TOKEN: z.string().min(1).optional(),
    MELHORENVIO_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(16).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    const required = (key: keyof typeof env, reason: string) => {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: reason })
    }
    if (!env.FIRESTORE_EMULATOR_HOST) {
      required('FIREBASE_CLIENT_EMAIL', 'obrigatória fora do emulador')
      required('FIREBASE_PRIVATE_KEY', 'obrigatória fora do emulador')
    }
    if (env.NODE_ENV === 'production') {
      required('UPSTASH_REDIS_REST_URL', 'obrigatória em produção')
      required('UPSTASH_REDIS_REST_TOKEN', 'obrigatória em produção')
    }
    // Só o deploy de produção da Vercel exige as integrações: o build local e o preview
    // também rodam com NODE_ENV=production e podem ficar sem elas.
    if (env.VERCEL_ENV === 'production') {
      const reason = 'obrigatória no deploy de produção'
      required('MERCADOPAGO_ACCESS_TOKEN', reason)
      required('MERCADOPAGO_WEBHOOK_SECRET', reason)
      required('MELHORENVIO_TOKEN', reason)
      required('RESEND_API_KEY', reason)
      required('EMAIL_FROM', reason)
      required('CRON_SECRET', reason)
      required('CLOUDINARY_API_KEY', reason)
      required('CLOUDINARY_API_SECRET', reason)
    }
  })

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return parseEnv(serverEnvSchema, source)
}

let cached: ServerEnv | undefined

export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}
