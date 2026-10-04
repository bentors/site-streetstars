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
    <Link href={`/produto/${product.slug}`} className="group block animate-appear select-none">
      <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-sm bg-surface">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
          <span className="block w-full bg-paper py-2 text-center text-[10px] font-bold tracking-widest text-ink uppercase shadow-lg">
            Ver peça
          </span>
        </div>
      </div>
      <h3 className="truncate text-xs font-bold tracking-[0.15em] uppercase transition-colors group-hover:text-paper/80">
        {product.name}
      </h3>
      <p className="mt-1 text-sm font-semibold text-paper/90">{formatBRL(product.priceCents)}</p>
    </Link>
  )
}
