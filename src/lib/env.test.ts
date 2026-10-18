import { describe, expect, it } from 'vitest'
import { parseEnv, publicEnvSchema } from './env'

const valid = {
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'dev.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'street-stars-dev',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
}

describe('publicEnv', () => {
  it('NEXT_PUBLIC opcional vazio conta como ausente', () => {
    const env = parseEnv(publicEnvSchema, { ...valid, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: '' })
    expect(env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME).toBeUndefined()
  })

  it('aceita configuração completa', () => {
    expect(parseEnv(publicEnvSchema, valid)).toEqual(valid)
  })
  it('lista as variáveis ausentes no erro', () => {
    const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_FIREBASE_APP_ID, ...rest } = valid
    void NEXT_PUBLIC_SITE_URL
    void NEXT_PUBLIC_FIREBASE_APP_ID
    expect(() => parseEnv(publicEnvSchema, rest)).toThrow(
      'Variáveis de ambiente inválidas ou ausentes: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_FIREBASE_APP_ID',
    )
  })
})
