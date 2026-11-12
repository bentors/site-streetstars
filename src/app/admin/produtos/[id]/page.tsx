import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/features/admin/product-form'
import { productToForm } from '@/lib/admin-product'
import { requireAdmin } from '@/server/auth/session'
import { listAllCollections } from '@/server/db/collections'
import { getProductById } from '@/server/db/products'

export const metadata: Metadata = { title: 'Editar produto' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [product, collections] = await Promise.all([getProductById(id), listAllCollections()])
  if (!product) notFound()
  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/produtos" className="text-[10px] tracking-widest text-muted uppercase">
        ← Produtos
      </Link>
      {product.status === 'active' ? (
        <Link
          href={`/produto/${product.slug}`}
          target="_blank"
          className="self-start text-xs underline"
        >
          Ver na loja
        </Link>
      ) : null}
      <ProductForm
        productId={product.id}
        initial={productToForm(product)}
        collections={collections.map((collection) => ({
          id: collection.id,
          title: collection.title,
        }))}
      />
    </div>
  )
}
