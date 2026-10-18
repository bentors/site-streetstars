import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui'
import { ProductRowActions } from '@/features/admin/product-row-actions'
import { formatBRL } from '@/lib/money'
import { requireAdmin } from '@/server/auth/session'
import { listAllProducts } from '@/server/db/products'

export const metadata: Metadata = { title: 'Produtos' }

const STATUS = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  active: { label: 'À venda', tone: 'success' },
  archived: { label: 'Arquivado', tone: 'warning' },
} as const

export default async function AdminProductsPage() {
  await requireAdmin()
  const products = await listAllProducts()
  const nextFeaturedOrder = Math.max(0, ...products.map((p) => p.featuredOrder ?? 0)) + 1
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/produtos/novo"
        className="self-start bg-paper px-5 py-3 text-xs font-black tracking-widest text-ink uppercase"
      >
        Novo produto
      </Link>
      {products.length === 0 ? <p className="text-xs text-muted">Nenhum produto ainda.</p> : null}
      <ul className="flex flex-col divide-y divide-line border border-line">
        {products.map((product) => (
          <li
            // A ordem muda a chave: o campo se realinha com o valor salvo depois do refresh.
            key={`${product.id}-${product.featuredOrder ?? 'x'}`}
            className="flex flex-wrap items-center gap-4 p-4"
          >
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt=""
                width={56}
                height={56}
                className="size-14 object-cover"
              />
            ) : null}
            <div className="flex min-w-48 flex-1 flex-col gap-1">
              <Link href={`/admin/produtos/${product.id}`} className="text-sm font-bold underline">
                {product.name}
              </Link>
              <span className="font-mono text-[10px] text-muted">
                {formatBRL(product.priceCents)} · /produto/{product.slug}
              </span>
            </div>
            <Badge tone={STATUS[product.status].tone}>{STATUS[product.status].label}</Badge>
            {product.featured ? (
              <Badge tone="info">Destaque {product.featuredOrder ?? ''}</Badge>
            ) : null}
            <ProductRowActions
              id={product.id}
              status={product.status}
              featured={product.featured}
              featuredOrder={product.featuredOrder}
              nextFeaturedOrder={nextFeaturedOrder}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
