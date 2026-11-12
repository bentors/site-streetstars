import { describe, expect, it } from 'vitest'
import { cloudinaryPublicId, cloudinaryUrl, isCloudinaryUrl } from './cloudinary'

const BASE = 'https://res.cloudinary.com/dmsvju9ca/image/upload'

describe('cloudinaryUrl', () => {
  it('insere as transformações depois de /upload/', () => {
    expect(cloudinaryUrl(`${BASE}/v1769638546/hero_rb9jvq.jpg`, { width: 800 })).toBe(
      `${BASE}/f_auto,q_auto,c_limit,w_800/v1769638546/hero_rb9jvq.jpg`,
    )
  })

  it('troca transformações que já existiam', () => {
    expect(
      cloudinaryUrl(`${BASE}/f_auto,q_auto,c_limit,dpr_auto,w_600/v1/hero.jpg`, {
        width: 1200,
        format: 'jpg',
      }),
    ).toBe(`${BASE}/f_jpg,q_auto,c_limit,w_1200/v1/hero.jpg`)
  })

  it('não confunde arquivo com sublinhado com transformação', () => {
    expect(cloudinaryUrl(`${BASE}/esiu_main.jpg`, { width: 400 })).toBe(
      `${BASE}/f_auto,q_auto,c_limit,w_400/esiu_main.jpg`,
    )
  })

  it('devolve URLs de fora do Cloudinary sem mudar', () => {
    expect(cloudinaryUrl('https://example.com/a.jpg', { width: 100 })).toBe(
      'https://example.com/a.jpg',
    )
    expect(isCloudinaryUrl('https://example.com/a.jpg')).toBe(false)
  })
})

describe('cloudinaryPublicId', () => {
  it('remove transformações, versão e extensão', () => {
    expect(cloudinaryPublicId(`${BASE}/f_auto,w_600/v1769638546/produtos/hero_rb9jvq.jpg`)).toBe(
      'produtos/hero_rb9jvq',
    )
    expect(cloudinaryPublicId(`${BASE}/esiu-main.jpg`)).toBe('esiu-main')
  })
})
