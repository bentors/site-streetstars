'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const items = [
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/colecoes', label: 'Coleções' },
  { href: '/admin/cupons', label: 'Cupons' },
  { href: '/admin/configuracoes', label: 'Configurações' },
]

export function AdminNav({ unseen }: { unseen: number }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Painel" className="flex gap-6 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
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
            {item.href === '/admin/pedidos' && unseen > 0 ? (
              <span className="ml-2 bg-warning px-1.5 py-0.5 text-[9px] text-ink">{unseen}</span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
