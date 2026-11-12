import { beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({
  server: {} as Record<string, string | undefined>,
  public: {} as Record<string, string | undefined>,
}))
vi.mock('@/server/env', () => ({ serverEnv: () => env.server }))
vi.mock('@/lib/env', () => ({ publicEnv: () => env.public }))

import { signParams, uploadSignature } from './cloudinary'

beforeEach(() => {
  env.server = { CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'abcd' }
  env.public = { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'demo' }
})

describe('signParams', () => {
  it('reproduz o exemplo da documentação do Cloudinary', () => {
    expect(
      signParams(
        {
          timestamp: 1315060510,
          public_id: 'sample_image',
          eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
        },
        'abcd',
      ),
    ).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e')
  })
})

describe('uploadSignature', () => {
  it('assina pasta e timestamp em segundos', () => {
    const signed = uploadSignature(new Date('2026-10-18T12:00:00.500Z'))
    expect(signed).toEqual({
      cloudName: 'demo',
      apiKey: 'key',
      folder: 'streetstars',
      timestamp: 1792324800,
      signature: signParams({ folder: 'streetstars', timestamp: 1792324800 }, 'abcd'),
    })
  })

  it('sem configuração devolve null', () => {
    env.server = {}
    expect(uploadSignature()).toBeNull()
  })
})
