'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { Logo } from '@/components/brand/logo'
import { CartButton } from '@/features/cart/cart-button'
import { cn } from '@/lib/cn'

const LINKS = [
  { label: 'Shop', href: '/#shop' },
  { label: 'Coleções', href: '/#colecoes' },
  { label: 'Manifesto', href: '/#manifesto' },
  { label: 'Quem somos', href: '/#sobre' },
  { label: 'Contato', href: '/#contato' },
]

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 40,
    () => false,
  )

  const solid = scrolled || open || pathname !== '/'

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        solid ? 'border-b border-line bg-ink' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="Street Stars — página inicial" onClick={() => setOpen(false)}>
          <Logo className="h-8 w-auto text-paper md:h-10" />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs tracking-widest text-paper/60 uppercase hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
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
          className="border-t border-line bg-ink px-6 py-4 md:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3 text-sm tracking-[0.2em] text-paper/70 uppercase hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  )
}
