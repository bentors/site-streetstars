'use client'

import { useState } from 'react'
import { CATEGORIES } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { ProductCard, type ProductCardData } from './product-card'

const ALL = 'TODOS'

export function ProductGrid({
  products,
  heading,
}: {
  products: ProductCardData[]
  heading?: React.ReactNode
}) {
  const [filter, setFilter] = useState<string>(ALL)
  const available = CATEGORIES.filter((category) => products.some((p) => p.category === category))
  const visible = filter === ALL ? products : products.filter((p) => p.category === filter)

  return (
    <div className="flex flex-col">
      <div className="mb-16 flex flex-col justify-between gap-10 border-b border-line pb-8 xl:flex-row xl:items-end">
        {heading}
        {products.length > 0 ? (
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
                  'relative py-1 text-[11px] tracking-[0.2em] uppercase transition-colors',
                  'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-paper after:transition-transform after:duration-300',
                  filter === category
                    ? 'font-bold text-paper after:scale-x-100'
                    : 'text-paper/50 after:scale-x-0 hover:text-paper',
                )}
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">Novidades em breve.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={`${filter}-${product.id}`} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
