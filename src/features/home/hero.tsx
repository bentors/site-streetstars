import Image from 'next/image'
import Link from 'next/link'
import { HOME_IMAGES } from './content'

export function Hero() {
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 text-center">
      <Image
        src={HOME_IMAGES.hero}
        alt="Jovens vestindo roupas Street Stars"
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="animate-hero-zoom object-cover object-[55%_65%] sm:object-[50%_20%] lg:object-[50%_18%]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/65"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-4xl animate-rise">
        <p className="mb-6 text-xs tracking-[0.35em] text-paper/60 lg:text-xl">STREET STARS</p>
        <h1 className="mb-6 text-3xl font-black tracking-tighter uppercase sm:text-5xl md:text-6xl lg:text-7xl">
          Estrelas nascem <br /> nas ruas
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-sm leading-relaxed font-light text-paper/80 sm:text-base md:text-lg">
          A Street Stars nasce da rua, da cultura urbana e da expressão individual.{' '}
          <br className="hidden sm:block" />
          Mais do que moda, transformamos quem veste em estrela.
        </p>
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/#shop"
              className="rounded-full bg-paper px-8 py-4 text-sm font-bold text-ink transition-all duration-300 hover:scale-[1.03] hover:bg-zinc-200 active:scale-95 sm:px-10 sm:text-base"
            >
              Comprar agora
            </Link>
            <Link
              href="/#colecoes"
              className="rounded-full border border-paper/40 px-8 py-4 text-sm font-semibold text-paper/80 transition-all duration-300 hover:scale-[1.02] hover:border-paper hover:text-paper active:scale-95 sm:px-10 sm:text-base"
            >
              Ver coleções
            </Link>
          </div>
          <p className="text-[8px] tracking-[0.2em] text-paper/30" aria-hidden="true">
            ★ Feito por quem vive a rua ★
          </p>
        </div>
      </div>
    </section>
  )
}
