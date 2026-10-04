'use client'

import { useState } from 'react'
import { CATEGORIES } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ProductCard, type ProductCardData } from './product-card'

const ALL = 'TODOS'

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  const [filter, setFilter] = useState<string>(ALL)
  const available = CATEGORIES.filter((category) => products.some((p) => p.category === category))
  const visible = filter === ALL ? products : products.filter((p) => p.category === filter)

  if (products.length === 0) {
    return <p className="py-20 text-center text-sm text-muted">Novidades em breve.</p>
  }

  return (
    <div className="flex flex-col gap-12">
      <div
        role="group"
        aria-label="Filtrar por categoria"
        className="flex flex-wrap gap-x-6 gap-y-3"
      >
        {[ALL, ...available].map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={filter === category}
            onClick={() => setFilter(category)}
            className={cn(
              'border-b py-1 text-[11px] tracking-[0.2em] uppercase',
              filter === category
                ? 'border-paper font-bold text-paper'
                : 'border-transparent text-muted hover:text-paper',
            )}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 lg:grid-cols-4">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
