import Image from 'next/image'
import Link from 'next/link'
import { HOME_IMAGES } from './content'

export function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-32"
    >
      <Image
        src={HOME_IMAGES.manifestoDesktop}
        alt=""
        fill
        sizes="100vw"
        className="hidden object-cover opacity-50 contrast-125 md:block"
      />
      <Image
        src={HOME_IMAGES.manifestoMobile}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-50 contrast-125 md:hidden"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-4xl space-y-16 text-center">
        <h2 className="space-y-4 text-3xl leading-none font-black tracking-tighter uppercase italic sm:text-4xl md:text-6xl">
          <span className="block text-paper/60">A rua é palco.</span>
          <span className="block text-paper/80">O corpo é voz.</span>
          <span className="block">A roupa é mensagem.</span>
        </h2>
        <div className="mx-auto max-w-2xl rounded-md border border-line bg-black/40 p-8 backdrop-blur-md sm:p-12">
          <p className="text-lg leading-relaxed font-light text-paper/90 sm:text-xl">
            A Street Stars acredita que estilo é extensão da identidade. Não seguimos tendências,
            criamos movimentos.
          </p>
          <p className="mt-6 text-sm font-bold tracking-widest uppercase md:text-base">
            Vestir Street Stars é viver a rua. Ser a estrela.
          </p>
        </div>
        <Link
          href="/#shop"
          className="inline-block rounded-full border border-paper px-10 py-4 text-xs font-bold tracking-[0.1em] uppercase hover:bg-paper hover:text-ink"
        >
          Acessar shop
        </Link>
      </div>
    </section>
  )
}
