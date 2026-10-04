import Image from 'next/image'
import Link from 'next/link'
import type { StoreCollection } from '@/server/catalog'

export function CollectionsArchive({ collections }: { collections: StoreCollection[] }) {
  if (collections.length === 0) return null
  return (
    <section id="colecoes" className="bg-neutral-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 text-4xl leading-none font-black tracking-tighter uppercase italic md:text-6xl">
          Visual <br />
          <span className="text-transparent [-webkit-text-stroke:1px_white]">Archive</span>
        </h2>
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-8 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0">
          {collections.map((collection, index) => (
            <Link
              key={collection.slug}
              href={`/colecao/${collection.slug}`}
              className="group relative block aspect-[3/4] min-w-[85%] snap-center overflow-hidden border border-line bg-surface sm:min-w-[45%] md:min-w-0"
            >
              <Image
                src={collection.coverImage}
                alt={collection.title}
                fill
                sizes="(max-width: 768px) 85vw, 33vw"
                className="object-cover transition-opacity duration-700 group-hover:opacity-0"
              />
              {collection.hoverImage ? (
                <Image
                  src={collection.hoverImage}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 85vw, 33vw"
                  className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                <span className="w-fit border border-paper/30 bg-black/30 px-2 py-1 text-[9px] tracking-widest uppercase">
                  Drop {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-2xl leading-none uppercase italic">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
