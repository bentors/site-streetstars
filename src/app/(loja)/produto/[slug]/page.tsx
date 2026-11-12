import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/json-ld'
import { ProductCard } from '@/features/catalog/product-card'
import { ProductView } from '@/features/catalog/product-view'
import { cloudinaryUrl } from '@/lib/cloudinary'
import { publicEnv } from '@/lib/env'
import { productJsonLd } from '@/lib/product-seo'
import { getShopProducts, getStoreProduct } from '@/server/catalog'

export const revalidate = 3600

export async function generateStaticParams() {
  return (await getShopProducts()).map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const product = await getStoreProduct((await params).slug)
  if (!product) return {}
  const image = product.images[0]?.url
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: image
        ? [{ url: cloudinaryUrl(image, { width: 1200, format: 'jpg' }), width: 1200 }]
        : [],
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getStoreProduct(slug)
  if (!product) notFound()

  const related = (await getShopProducts())
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4)

  return (
    <div className="pt-24 pb-20">
      <JsonLd data={productJsonLd(product, publicEnv().NEXT_PUBLIC_SITE_URL)} />
      <ProductView product={product} />
      {related.length > 0 ? (
        <section className="mx-auto mt-24 max-w-7xl border-t border-line px-6 pt-16">
          <h2 className="mb-8 text-2xl font-black tracking-tighter uppercase italic md:text-3xl">
            Complete o kit
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                sizes="(max-width: 768px) 50vw, 25vw"
                product={{
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  priceCents: item.priceCents,
                  category: item.category,
                  image: item.images[0]?.url ?? '',
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
