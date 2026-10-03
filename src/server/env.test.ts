import { describe, expect, it } from 'vitest'
import { parseServerEnv } from './env'

describe('parseServerEnv', () => {
  it('aceita emulador sem credenciais', () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      FIREBASE_PROJECT_ID: 'demo-streetstars',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    })
    expect(env.FIREBASE_PROJECT_ID).toBe('demo-streetstars')
  })

  it('exige credenciais quando não há emulador', () => {
    expect(() =>
      parseServerEnv({ NODE_ENV: 'development', FIREBASE_PROJECT_ID: 'street-stars-dev' }),
    ).toThrow(/FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY/)
  })

  it('converte \n literais da chave privada em quebras de linha', () => {
    const env = parseServerEnv({
      NODE_ENV: 'development',
      FIREBASE_PROJECT_ID: 'street-stars-dev',
      FIREBASE_CLIENT_EMAIL: 'sa@dev.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    })
    expect(env.FIREBASE_PRIVATE_KEY).toBe(
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
    )
  })

  it('exige Upstash em produção', () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: 'production',
        FIREBASE_PROJECT_ID: 'street-stars-system',
        FIREBASE_CLIENT_EMAIL: 'sa@prod.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: 'key',
      }),
    ).toThrow(/UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN/)
  })
})
