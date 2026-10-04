'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Logo } from '@/components/brand/logo'
import { CartButton } from '@/features/cart/cart-button'
import { cn } from '@/lib/cn'

const LINKS = [
  { label: 'Shop', id: 'shop' },
  { label: 'Coleções', id: 'colecoes' },
  { label: 'Manifesto', id: 'manifesto' },
  { label: 'Quem somos', id: 'sobre' },
  { label: 'Contato', id: 'contato' },
]

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

const atBottom = () =>
  window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100

/** Seção da home que está no meio da tela (só na home). */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (atBottom()) return setActive('contato')
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-40% 0px -50% 0px' },
    )
    const ids = new Set(LINKS.map((link) => link.id))
    document.querySelectorAll('section[id], footer[id]').forEach((element) => {
      if (ids.has(element.id)) observer.observe(element)
    })
    // O rodapé é curto e pode nunca cruzar o meio da tela.
    const onScroll = () => {
      if (atBottom()) setActive('contato')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [enabled])

  return enabled ? active : null
}

export function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [open, setOpen] = useState(false)
  const active = useActiveSection(isHome)
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 40,
    () => false,
  )
  const navRef = useRef<HTMLElement>(null)
  const starRef = useRef<HTMLSpanElement>(null)

  // A estrela desliza até o link ativo (estilo aplicado direto no elemento, sem re-render).
  useEffect(() => {
    const star = starRef.current
    const link = active ? navRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`) : null
    if (!star) return
    if (!link) {
      star.style.opacity = '0'
      return
    }
    star.style.opacity = '1'
    star.style.transform = `translateX(${link.offsetLeft + link.offsetWidth / 2}px) translateX(-50%)`
  }, [active])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const solid = scrolled || open || !isHome

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 animate-header-in transition-colors duration-500',
          solid ? 'border-b border-line bg-ink shadow-xl' : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="Street Stars — página inicial" onClick={() => setOpen(false)}>
            <Logo className="h-8 w-auto text-paper transition-opacity hover:opacity-80 md:h-12" />
          </Link>

          <nav
            ref={navRef}
            aria-label="Navegação principal"
            className="relative hidden items-center gap-8 md:flex"
          >
            {LINKS.map((link) => (
              <Link
                key={link.id}
                href={`/#${link.id}`}
                data-id={link.id}
                aria-current={active === link.id ? 'location' : undefined}
                className={cn(
                  'text-xs tracking-widest uppercase transition-colors',
                  active === link.id ? 'font-bold text-paper' : 'text-paper/60 hover:text-paper',
                )}
              >
                {link.label}
              </Link>
            ))}
            <span
              ref={starRef}
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 left-0 text-[10px] text-paper opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
            >
              ★
            </span>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/conta"
              aria-label="Minha conta"
              className="flex size-10 items-center justify-center text-paper/80 hover:text-paper"
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
            <CartButton />
            <button
              type="button"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="flex size-10 items-center justify-center text-paper/80 hover:text-paper md:hidden"
            >
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {open ? (
          <nav
            aria-label="Navegação mobile"
            className="flex flex-col gap-5 border-t border-line bg-ink/95 p-6 md:hidden"
          >
            {LINKS.map((link) => (
              <Link
                key={link.id}
                href={`/#${link.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'border-b border-paper/5 py-2 text-sm tracking-[0.2em] uppercase transition-colors',
                  active === link.id
                    ? 'border-l-2 border-l-paper pl-4 font-bold text-paper'
                    : 'text-paper/60 hover:text-paper',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      {open ? (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      ) : null}
    </>
  )
}
