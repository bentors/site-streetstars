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
      .transform((key) => key?.replace(/\n/g, '\n')),
    FIRESTORE_EMULATOR_HOST: z.string().min(1).optional(),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
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
