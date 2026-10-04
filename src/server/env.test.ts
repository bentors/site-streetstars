import { describe, expect, it } from 'vitest'
import { parseServerEnv } from './env'

const SECRET = 'x'.repeat(32)

const emulator = {
  NODE_ENV: 'test',
  FIREBASE_PROJECT_ID: 'demo-streetstars',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  ORDER_TOKEN_SECRET: SECRET,
}

const credentials = {
  FIREBASE_PROJECT_ID: 'street-stars-system',
  FIREBASE_CLIENT_EMAIL: 'sa@prod.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: 'key',
  ORDER_TOKEN_SECRET: SECRET,
}

const upstash = {
  UPSTASH_REDIS_REST_URL: 'https://x.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 't',
}

const integrations = {
  MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-1',
  MERCADOPAGO_WEBHOOK_SECRET: 'whsec',
  MELHORENVIO_TOKEN: 'me-token',
  RESEND_API_KEY: 're_1',
  EMAIL_FROM: 'Street Stars <pedidos@streetstars.com.br>',
  CRON_SECRET: 'c'.repeat(32),
}

describe('parseServerEnv', () => {
  it('aceita emulador sem credenciais', () => {
    const env = parseServerEnv(emulator)
    expect(env.FIREBASE_PROJECT_ID).toBe('demo-streetstars')
    expect(env.MELHORENVIO_ENV).toBe('sandbox')
  })

  it('exige credenciais quando não há emulador', () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: 'development',
        FIREBASE_PROJECT_ID: 'street-stars-dev',
        ORDER_TOKEN_SECRET: SECRET,
      }),
    ).toThrow(/FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY/)
  })

  it('converte \n literais da chave privada em quebras de linha', () => {
    const env = parseServerEnv({
      ...credentials,
      NODE_ENV: 'development',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    })
    expect(env.FIREBASE_PRIVATE_KEY).toBe(
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
    )
  })

  it('exige Upstash em produção', () => {
    expect(() => parseServerEnv({ ...credentials, NODE_ENV: 'production' })).toThrow(
      /UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN/,
    )
  })

  it('exige o segredo dos links de pedido com 32 caracteres ou mais', () => {
    expect(() => parseServerEnv({ ...emulator, ORDER_TOKEN_SECRET: 'curto' })).toThrow(
      /ORDER_TOKEN_SECRET/,
    )
  })

  it('exige as integrações no deploy de produção da Vercel', () => {
    expect(() =>
      parseServerEnv({
        ...credentials,
        ...upstash,
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
      }),
    ).toThrow(
      /MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET, MELHORENVIO_TOKEN, RESEND_API_KEY, EMAIL_FROM, CRON_SECRET/,
    )
  })

  it('preview e build local funcionam sem as integrações', () => {
    const env = parseServerEnv({
      ...credentials,
      ...upstash,
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
    })
    expect(env.MERCADOPAGO_ACCESS_TOKEN).toBeUndefined()
  })

  it('aceita produção completa', () => {
    const env = parseServerEnv({
      ...credentials,
      ...upstash,
      ...integrations,
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      MELHORENVIO_ENV: 'production',
    })
    expect(env.MELHORENVIO_ENV).toBe('production')
  })
})
