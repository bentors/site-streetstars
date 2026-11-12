import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CollectionGallery } from '@/features/catalog/collection-gallery'
import { cloudinaryUrl } from '@/lib/cloudinary'
import { getStoreCollection, getStoreCollections } from '@/server/catalog'

export const revalidate = 3600

export async function generateStaticParams() {
  return (await getStoreCollections()).map((collection) => ({ slug: collection.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const collection = await getStoreCollection((await params).slug)
  if (!collection) return {}
  return {
    title: collection.title,
    description: collection.shortDescription,
    alternates: { canonical: `/colecao/${collection.slug}` },
    openGraph: {
      images: [
        {
          url: cloudinaryUrl(collection.coverImage, { width: 1200, format: 'jpg' }),
          width: 1200,
        },
      ],
    },
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const collection = await getStoreCollection((await params).slug)
  if (!collection) notFound()
  const credits = [
    ['Foto', collection.credits.photo],
    ['Direção', collection.credits.direction],
    ['Styling', collection.credits.styling],
  ].filter(([, value]) => value)

  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-20 md:pt-40">
      <div className="mb-24 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[3/4] overflow-hidden border border-line bg-surface">
          <Image
            src={collection.coverImage}
            alt={`Capa da coleção ${collection.title}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <Link
            href="/#colecoes"
            className="mb-8 text-[10px] tracking-[0.2em] text-muted uppercase hover:text-paper"
          >
            ← Voltar para coleções
          </Link>
          <h1 className="mb-8 text-4xl leading-[0.9] font-black tracking-tighter uppercase italic md:text-6xl">
            {collection.title}
          </h1>
          <blockquote className="mb-8 border-l-2 border-paper pl-6 text-sm leading-relaxed font-light text-paper/90 md:text-xl">
            {collection.shortDescription}
          </blockquote>
          <div className="mb-12 space-y-4 text-sm leading-loose font-light text-paper/60">
            {collection.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {credits.length > 0 ? (
            <dl className="mb-12 grid grid-cols-3 gap-4 border-t border-line pt-6 text-[10px] tracking-widest uppercase">
              {credits.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="mt-1 tracking-normal text-paper/80 normal-case">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <Link
            href="/#shop"
            className="mt-auto block border border-paper py-5 text-center text-xs font-black tracking-[0.25em] uppercase hover:bg-paper hover:text-ink"
          >
            Ver peças disponíveis
          </Link>
        </div>
      </div>
      {collection.gallery.length > 0 ? (
        <section className="border-t border-line pt-20">
          <h2 className="mb-12 text-2xl font-black tracking-tighter uppercase italic">Lookbook</h2>
          <CollectionGallery title={collection.title} images={collection.gallery} />
        </section>
      ) : null}
    </div>
  )
}
