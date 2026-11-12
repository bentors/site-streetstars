'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const items = [
  { href: '/conta', label: 'Pedidos' },
  { href: '/conta/enderecos', label: 'Endereços' },
  { href: '/conta/perfil', label: 'Perfil' },
  { href: '/conta/seguranca', label: 'Segurança' },
]

export function AccountNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Minha conta" className="flex gap-6 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 pb-3 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-colors',
              active ? 'border-paper text-paper' : 'border-transparent text-muted hover:text-paper',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
