import type { Metadata } from 'next'
import { ProductForm } from '@/features/admin/product-form'
import { productToForm } from '@/lib/admin-product'
import { requireAdmin } from '@/server/auth/session'
import { listAllCollections } from '@/server/db/collections'

export const metadata: Metadata = { title: 'Novo produto' }

export default async function NewProductPage() {
  await requireAdmin()
  const collections = await listAllCollections()
  return (
    <ProductForm
      productId={null}
      initial={productToForm(null)}
      collections={collections.map(({ id, title }) => ({ id, title }))}
    />
  )
}
