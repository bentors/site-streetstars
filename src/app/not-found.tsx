import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

export const metadata: Metadata = { title: 'Página não encontrada' }

// Mesmo traço do logo: números e estrela em contorno, sem preenchimento, com a mesma espessura.
const OUTLINE =
  'text-transparent [-webkit-text-stroke:2px_var(--color-paper)] lg:[-webkit-text-stroke:3px_var(--color-paper)]'

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-6">
      <Link
        href="/"
        aria-label="Street Stars — página inicial"
        className="mx-auto mt-8 w-fit transition-opacity hover:opacity-70 md:mx-0"
      >
        <Logo className="h-6 w-auto text-paper md:h-8" />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        <p
          aria-hidden="true"
          className={`flex items-center font-display text-[34vw] leading-none font-bold tracking-tighter select-none lg:text-[22rem] ${OUTLINE}`}
        >
          <span>4</span>
          {/* A estrela é o zero: cai como estrela cadente e para torta, fora da linha. */}
          <svg
            viewBox="0 0 100 100"
            className="mx-[4vw] size-[22vw] animate-star-fall [stroke-width:2px] text-paper lg:mx-6 lg:size-[16rem] lg:[stroke-width:3px]"
          >
            {/* Traço em px fixos (não escala com o SVG), igual ao contorno dos números. */}
            <polygon
              points="50,4 61,38 97,38 68,59 79,93 50,72 21,93 32,59 3,38 39,38"
              fill="none"
              stroke="currentColor"
              strokeLinejoin="miter"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span>4</span>
        </p>

        <h1 className="mt-10 text-3xl leading-none font-black tracking-tighter uppercase italic md:text-5xl">
          <span className="sr-only">Erro 404: página não encontrada. </span>
          Essa estrela se perdeu no caminho
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed font-light text-balance text-paper/70 md:text-base">
          O endereço que você abriu não existe ou a página saiu do ar.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/#shop"
            className="rounded-full bg-paper px-8 py-4 text-sm font-bold text-ink transition-all duration-300 hover:scale-[1.03] hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper active:scale-95"
          >
            Ir para o shop
          </Link>
          <Link
            href="/"
            className="rounded-full border border-paper/40 px-8 py-4 text-sm font-semibold text-paper/80 transition-all duration-300 hover:border-paper hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper active:scale-95"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </main>
  )
}
