import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/json-ld'
import { ProductGrid } from '@/features/catalog/product-grid'
import { About } from '@/features/home/about'
import { CollectionsArchive } from '@/features/home/collections-archive'
import { HOME_IMAGES } from '@/features/home/content'
import { Hero } from '@/features/home/hero'
import { Manifesto } from '@/features/home/manifesto'
import { cloudinaryUrl } from '@/lib/cloudinary'
import { publicEnv } from '@/lib/env'
import { getShopProducts, getStoreCollections } from '@/server/catalog'

export const revalidate = 3600

const description =
  'Streetwear autêntico nascido em São Paulo. Transformamos vivência urbana em estilo, identidade e movimento.'

export const metadata: Metadata = {
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'Street Stars | Estrelas nascem nas ruas',
    description,
    images: [
      {
        url: cloudinaryUrl(HOME_IMAGES.share, { width: 1200, format: 'jpg' }),
        width: 1200,
        height: 630,
      },
    ],
  },
}

export default async function HomePage() {
  const [products, collections] = await Promise.all([getShopProducts(), getStoreCollections()])
  const siteUrl = publicEnv().NEXT_PUBLIC_SITE_URL

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ClothingStore',
          name: 'Street Stars',
          url: siteUrl,
          description,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'São Paulo',
            addressRegion: 'SP',
            addressCountry: 'BR',
          },
          sameAs: ['https://www.instagram.com/_streetstars.co/'],
        }}
      />
      <Hero />
      <section id="shop" className="min-h-dvh py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <ProductGrid
            heading={
              <div className="max-w-2xl">
                <h2 className="text-4xl leading-[0.9] font-black tracking-tighter uppercase italic sm:text-5xl md:text-6xl">
                  Seja uma <br />
                  <span className="text-transparent [-webkit-text-stroke:1px_white]">
                    Estrela das Ruas
                  </span>
                </h2>
                <p className="mt-4 text-sm tracking-widest text-paper/50 uppercase">
                  com Street Stars ®
                </p>
              </div>
            }
            products={products.map((p) => ({
              id: p.id,
              slug: p.slug,
              name: p.name,
              priceCents: p.priceCents,
              category: p.category,
              image: p.images[0]?.url ?? '',
            }))}
          />
        </div>
      </section>
      <CollectionsArchive collections={collections} />
      <Manifesto />
      <About />
    </>
  )
}
