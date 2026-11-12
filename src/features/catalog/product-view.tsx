'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatBRL } from '@/lib/money'
import type { StoreProduct } from '@/server/catalog'
import { ProductGallery } from './product-gallery'
import { ProductPurchase } from './product-purchase'

export function ProductView({ product }: { product: StoreProduct }) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  // Fotos de cor que não estão na galeria entram no fim, para a troca de cor funcionar.
  const colorImages = product.colors
    .map((color) => color.image)
    .filter((url): url is string => !!url && !product.images.some((image) => image.url === url))
    .map((url) => ({ url, alt: product.name }))
  const images = [...product.images, ...colorImages]

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2 lg:gap-12">
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <ProductGallery images={images} activeUrl={activeUrl} />
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <nav
          aria-label="Breadcrumb"
          className="text-[10px] tracking-widest text-paper/40 uppercase"
        >
          <Link href="/" className="hover:text-paper">
            Home
          </Link>
          {' / '}
          <Link href="/#shop" className="hover:text-paper">
            {product.category}
          </Link>
          {' / '}
          <span className="text-paper/60">{product.name}</span>
        </nav>
        <div>
          <h1 className="mb-2 text-3xl leading-none font-black tracking-tighter uppercase italic md:text-5xl">
            {product.name}
          </h1>
          <p className="text-2xl font-bold">{formatBRL(product.priceCents)}</p>
          <p className="mt-2 text-[10px] tracking-widest text-muted uppercase">
            Feito sob demanda · produção em até {product.productionDays} dias úteis + frete
          </p>
        </div>
        <ProductPurchase
          product={{
            id: product.id,
            name: product.name,
            sizes: product.sizes,
            colors: product.colors,
            sizeGuide: product.sizeGuide,
          }}
          onColorChange={setActiveUrl}
        />
        {product.description ? (
          <div className="border-t border-line pt-6">
            <h2 className="mb-3 text-xs font-bold tracking-widest uppercase">Sobre</h2>
            <p className="text-sm leading-relaxed font-light whitespace-pre-line text-paper/70">
              {product.description}
            </p>
          </div>
        ) : null}
        {product.highlights.length > 0 ? (
          <div className="border-t border-line pt-6">
            <h2 className="mb-3 text-xs font-bold tracking-widest uppercase">Detalhes</h2>
            <ul className="space-y-2 text-xs text-paper/60">
              {product.highlights.map((highlight) => (
                <li key={highlight}>• {highlight}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
