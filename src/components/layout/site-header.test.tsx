import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CartProvider } from '@/features/cart/cart-context'
import { SiteHeader } from './site-header'

const nav = vi.hoisted(() => ({ pathname: '/produto/x' }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }))

const renderHeader = () =>
  render(
    <CartProvider>
      <SiteHeader />
    </CartProvider>,
  )

describe('SiteHeader', () => {
  it('fecha o menu mobile com Esc', async () => {
    nav.pathname = '/produto/x'
    renderHeader()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByRole('navigation', { name: 'Navegação mobile' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('navigation', { name: 'Navegação mobile' })).not.toBeInTheDocument()
  })

  it('home regenerada pela Vercel (pathname /index) começa transparente', () => {
    nav.pathname = '/index'
    window.scrollY = 0
    renderHeader()
    expect(document.querySelector('header')).toHaveClass('bg-transparent')
  })

  describe('estrela da home', () => {
    // O jsdom não tem layout: cada seção ganha uma posição fixa na página.
    function layout(offsets: Record<string, number>, { height = 768, page = 4900 } = {}) {
      nav.pathname = '/'
      window.innerHeight = height
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: page,
      })
      for (const [id, offset] of Object.entries(offsets)) {
        const section = document.createElement(id === 'contato' ? 'footer' : 'section')
        section.id = id
        section.getBoundingClientRect = () => ({ top: offset - window.scrollY }) as DOMRect
        document.body.append(section)
      }
      renderHeader()
    }
    const current = () =>
      screen
        .getByRole('navigation', { name: 'Navegação principal' })
        .querySelector('[aria-current]')?.textContent ?? null
    const scrollTo = (y: number) =>
      act(() => {
        window.scrollY = y
        window.dispatchEvent(new Event('scroll'))
      })

    afterEach(() => {
      document.querySelectorAll('section, footer').forEach((element) => element.remove())
      Reflect.deleteProperty(document.documentElement, 'scrollHeight')
      window.scrollY = 0
      window.innerHeight = 768
    })

    it('marca a seção no meio da tela e volta certo do rodapé para Quem somos', () => {
      layout({ shop: 800, colecoes: 1800, manifesto: 2600, sobre: 3400, contato: 4400 })

      expect(current()).toBeNull()
      scrollTo(1000)
      expect(current()).toBe('Shop')
      scrollTo(4200)
      expect(current()).toBe('Contato')
      scrollTo(4000)
      expect(current()).toBe('Quem somos')
      scrollTo(0)
      expect(current()).toBeNull()
    })

    it('em tela alta, chegar a Quem somos no fim da página não marca Contato', () => {
      layout({ shop: 800, sobre: 3800, contato: 4400 }, { height: 1200 })
      // O clique em Quem somos esbarra no fim da página: a seção fica 100px abaixo do topo.
      scrollTo(3700)
      expect(current()).toBe('Quem somos')
    })
  })
})
