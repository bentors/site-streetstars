import { describe, expect, it } from 'vitest'
import { fillLegalText, isLegalSlug, LEGAL_PAGES } from './legal'
import { DEFAULT_STORE_SETTINGS } from './store-settings'

describe('legal', () => {
  it('tem as três páginas, sem marcadores esquecidos fora do padrão', () => {
    expect(Object.keys(LEGAL_PAGES)).toEqual([
      'termos-de-uso',
      'politica-de-privacidade',
      'trocas-e-devolucoes',
    ])
    for (const page of Object.values(LEGAL_PAGES)) {
      const unknown = [...page.text.matchAll(/\{\{(\w+)\}\}/g)]
        .map((m) => m[1])
        .filter(
          (name) => !['whatsapp', 'email', 'cnpj', 'siteHost', 'instagram'].includes(name ?? ''),
        )
      expect(unknown).toEqual([])
    }
  })

  it('preenche os dados da loja', () => {
    const text =
      'WhatsApp: {{whatsapp}} · {{email}} · CNPJ: {{cnpj}} · {{siteHost}} · {{instagram}}'
    expect(
      fillLegalText(
        text,
        { ...DEFAULT_STORE_SETTINGS, whatsapp: '5511912345678', cnpj: '12.345.678/0001-90' },
        'streetstars.com.br',
      ),
    ).toBe(
      'WhatsApp: https://wa.me/5511912345678 · streetstars.company@gmail.com · CNPJ: 12.345.678/0001-90 · streetstars.com.br · @_streetstars.co',
    )
  })

  it('marca dados ainda não informados', () => {
    expect(fillLegalText('{{whatsapp}} {{cnpj}}', DEFAULT_STORE_SETTINGS, 'x')).toBe(
      'a informar a informar',
    )
  })

  it('isLegalSlug', () => {
    expect(isLegalSlug('termos-de-uso')).toBe(true)
    expect(isLegalSlug('privacidade')).toBe(false)
  })
})
