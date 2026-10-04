import Image from 'next/image'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'

export type ProductCardData = {
  id: string
  slug: string
  name: string
  priceCents: number
  category: string
  image: string
}

export function ProductCard({
  product,
  sizes = '(max-width: 1024px) 50vw, 25vw',
}: {
  product: ProductCardData
  sizes?: string
}) {
  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-surface">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <h3 className="truncate text-xs font-bold tracking-[0.15em] uppercase">{product.name}</h3>
      <p className="text-sm font-semibold text-paper/90">{formatBRL(product.priceCents)}</p>
    </Link>
  )
}
