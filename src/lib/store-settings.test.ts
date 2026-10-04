import { describe, expect, it } from 'vitest'
import { DEFAULT_STORE_SETTINGS, storeSettingsSchema, whatsappUrl } from './store-settings'

describe('store settings', () => {
  it('os padrões são válidos', () => {
    expect(storeSettingsSchema.parse(DEFAULT_STORE_SETTINGS)).toEqual(DEFAULT_STORE_SETTINGS)
  })

  it('whatsappUrl monta o link com mensagem', () => {
    expect(whatsappUrl('5511912345678', 'Olá!')).toBe('https://wa.me/5511912345678?text=Ol%C3%A1!')
    expect(whatsappUrl('5511912345678')).toBe('https://wa.me/5511912345678')
  })

  it('whatsappUrl devolve null sem número', () => {
    expect(whatsappUrl('')).toBeNull()
  })
})
