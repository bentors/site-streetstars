import Image from 'next/image'
import Link from 'next/link'
import { HOME_IMAGES } from './content'

const MARQUEE = Array.from({ length: 10 }, () => 'Street Stars ★ Be a star')
const LINES = [
  { text: 'A rua é palco.', className: 'text-paper/60' },
  { text: 'O corpo é voz.', className: 'text-paper/80' },
  { text: 'A roupa é mensagem.', className: 'text-paper' },
]

export function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-6 py-32"
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* 120% de altura deslocado em -10%: sobra para o parallax sem mostrar borda. */}
        <div className="parallax relative -top-[10%] h-[120%] w-full">
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
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      <div
        className="absolute inset-x-0 top-0 z-20 overflow-hidden border-b border-line bg-black/20 py-4 backdrop-blur-sm"
        aria-hidden="true"
      >
        <div className="flex w-max animate-marquee text-[10px] font-bold tracking-[0.4em] whitespace-nowrap text-paper/60 uppercase md:text-xs">
          {[...MARQUEE, ...MARQUEE].map((item, index) => (
            <span key={index} className="mx-6">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-10 max-w-4xl space-y-20 text-center">
        <h2 className="mb-24 space-y-4 text-3xl leading-none font-black tracking-tighter uppercase italic sm:text-4xl md:space-y-6 md:text-6xl">
          {LINES.map((line, index) => (
            <span
              key={line.text}
              className={`reveal block ${line.className}`}
              style={{ '--reveal-step': index } as React.CSSProperties}
            >
              {line.text}
            </span>
          ))}
        </h2>

        <div
          className="reveal mx-auto max-w-2xl rounded-md border border-line bg-black/40 p-8 backdrop-blur-md sm:p-12"
          style={{ '--reveal-y': '30px' } as React.CSSProperties}
        >
          <p className="text-lg leading-relaxed font-light text-paper/90 sm:text-xl">
            A Street Stars acredita que estilo é extensão da identidade. Não seguimos tendências,
            criamos movimentos.
          </p>
          <p className="mt-6 text-sm font-bold tracking-widest uppercase md:text-base">
            Vestir Street Stars é viver a rua. Ser a estrela.
          </p>
        </div>

        <div
          className="reveal mt-12 flex flex-col items-center gap-4"
          style={{ '--reveal-y': '30px' } as React.CSSProperties}
        >
          <p className="text-[10px] tracking-[0.3em] text-paper/50 uppercase">
            Pronto para se tornar uma estrela das ruas?
          </p>
          <Link
            href="/#shop"
            className="rounded-full border border-paper px-10 py-4 text-xs font-bold tracking-[0.1em] uppercase transition-all duration-300 hover:bg-paper hover:text-ink"
          >
            Acessar shop
          </Link>
        </div>
      </div>

      <div className="absolute top-1/2 right-6 hidden -translate-y-1/2 md:block" aria-hidden="true">
        <p className="rotate-180 text-[10px] font-bold tracking-[0.4em] text-paper/20 uppercase [writing-mode:vertical-rl]">
          Est. 2024 — São Paulo — Brasil
        </p>
      </div>
    </section>
  )
}
