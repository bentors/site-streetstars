'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatBRL } from '@/lib/money'
import type { StoreProduct } from '@/server/catalog'
import { ProductGallery } from './product-gallery'
import { ProductPurchase } from './product-purchase'

export function ProductView({ product }: { product: StoreProduct }) {
  const [color, setColor] = useState<string | null>(null)
  // Sem cor escolhida: só as fotos gerais. Com cor: as dela, depois as gerais. Geral é a foto sem
  // nenhuma cor existente marcada (marcação de cor apagada não pode esconder a foto).
  const names = new Set(product.colors.map((c) => c.name))
  const general = product.images.filter((image) => !image.colors.some((c) => names.has(c)))
  const cover = product.images[0]
  let selected = general
  if (color) selected = [...product.images.filter((i) => i.colors.includes(color)), ...general]
  // A capa (card da loja, prévia do link) abre a galeria mesmo marcada com uma cor.
  else if (cover && general.length > 0 && !general.includes(cover)) selected = [cover, ...general]
  // Nada para mostrar (sem fotos gerais nem da cor): todas, em vez de uma galeria vazia.
  const images = (selected.length > 0 ? selected : product.images).map((image) => ({
    url: image.url,
    alt: image.alt || product.name,
  }))

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2 lg:gap-12">
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        {/* A key remonta a galeria: trocar de cor volta para a primeira foto. */}
        <ProductGallery key={color ?? ''} images={images} />
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
          onColorChange={setColor}
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
