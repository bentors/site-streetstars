import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_STORE_SETTINGS } from '@/lib/store-settings'
import { SiteFooter } from './site-footer'
import { WhatsAppButton } from './whatsapp-button'

describe('SiteFooter', () => {
  it('mostra contatos e esconde WhatsApp sem número', () => {
    render(<SiteFooter settings={DEFAULT_STORE_SETTINGS} />)
    expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute(
      'href',
      'https://www.instagram.com/_streetstars.co/',
    )
    expect(screen.getByText('streetstars.company@gmail.com')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trocas e Devoluções' })).toHaveAttribute(
      'href',
      '/legal/trocas-e-devolucoes',
    )
  })

  it('mostra WhatsApp quando configurado', () => {
    const settings = { ...DEFAULT_STORE_SETTINGS, whatsapp: '5511912345678' }
    render(<SiteFooter settings={settings} />)
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/5511912345678',
    )
  })
})

describe('WhatsAppButton', () => {
  it('não aparece sem número', () => {
    const { container } = render(<WhatsAppButton settings={DEFAULT_STORE_SETTINGS} />)
    expect(container).toBeEmptyDOMElement()
  })
})
