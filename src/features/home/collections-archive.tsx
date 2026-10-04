import Image from 'next/image'
import Link from 'next/link'
import type { StoreCollection } from '@/server/catalog'
import { CollectionsCarousel } from './collections-carousel'

const SIZES = '(max-width: 768px) 85vw, 33vw'

export function CollectionsArchive({ collections }: { collections: StoreCollection[] }) {
  if (collections.length === 0) return null
  return (
    <section id="colecoes" className="overflow-hidden bg-neutral-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="text-4xl leading-none font-black tracking-tighter uppercase italic md:text-6xl">
            Visual <br />
            <span className="text-transparent [-webkit-text-stroke:1px_white]">Archive</span>
          </h2>
          <p className="max-w-xs text-[10px] tracking-[0.2em] text-paper/50 uppercase md:text-right">
            Nossos drops, nossa história. <br />
            Explore cada coleção que já lançamos.
          </p>
        </div>

        <CollectionsCarousel>
          {collections.map((collection, index) => (
            <div
              key={collection.slug}
              className="reveal h-full min-w-[85%] snap-center sm:min-w-[45%] md:min-w-0"
              style={{ '--reveal-step': index } as React.CSSProperties}
            >
              <Link
                href={`/colecao/${collection.slug}`}
                className="group relative block aspect-[3/4] h-full overflow-hidden border border-paper/5 bg-surface-2"
              >
                <div className="parallax absolute inset-x-0 -top-[10%] h-[120%]">
                  <Image
                    src={collection.coverImage}
                    alt={collection.title}
                    fill
                    sizes={SIZES}
                    className="object-cover transition-opacity duration-700 group-hover:opacity-0"
                  />
                  {collection.hoverImage ? (
                    <Image
                      src={collection.hoverImage}
                      alt=""
                      fill
                      sizes={SIZES}
                      className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                    />
                  ) : null}
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <span className="border border-paper/30 bg-black/30 px-2 py-1 text-[9px] tracking-widest uppercase backdrop-blur-sm">
                      Drop {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      aria-hidden="true"
                      className="translate-x-4 text-lg opacity-50 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    >
                      ↗
                    </span>
                  </div>
                  <div className="translate-y-4 transition-transform duration-500 ease-out group-hover:translate-y-0">
                    <h3 className="mb-2 font-display text-2xl leading-none uppercase italic drop-shadow-md">
                      {collection.title}
                    </h3>
                    <div className="mb-3 h-px w-0 bg-paper transition-all duration-700 group-hover:w-full" />
                    <p className="text-[10px] tracking-widest text-paper/70 uppercase opacity-0 transition-opacity delay-100 duration-500 group-hover:opacity-100">
                      Ver editorial
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </CollectionsCarousel>
      </div>
    </section>
  )
}
