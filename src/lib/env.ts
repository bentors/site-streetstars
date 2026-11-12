import { z } from 'zod'

export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
): z.infer<T> {
  // O Next lê `CHAVE=` como texto vazio; tratamos como ausente para não derrubar quem copiou o .env.example.
  const present = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ''),
  )
  const result = schema.safeParse(present)
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))]
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${names.join(', ')}`)
  }
  return result.data
}

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

let cached: PublicEnv | undefined

export function publicEnv(): PublicEnv {
  // Referências literais: o Next só embute NEXT_PUBLIC_* lidas assim no bundle do cliente.
  cached ??= parseEnv(publicEnvSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  })
  return cached
}
