import Image from 'next/image'
import { HOME_IMAGES } from './content'

const founder = 'border-b border-paper/30 pb-0.5 text-paper transition-colors hover:border-paper'

export function About() {
  return (
    <section id="sobre" className="relative overflow-hidden py-24 sm:py-32">
      <div
        className="absolute inset-y-0 left-1/2 hidden w-px bg-paper/5 lg:block"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:gap-24">
        <div className="relative">
          <div
            className="absolute top-4 -left-4 hidden size-full border border-paper/20 md:block"
            aria-hidden="true"
          />
          <div
            className="reveal relative z-10 h-[400px] overflow-hidden bg-surface-2 md:h-[550px]"
            style={{ '--reveal-y': '0px', '--reveal-scale': '0.95' } as React.CSSProperties}
          >
            <Image
              src={HOME_IMAGES.about}
              alt="Fundadores da Street Stars — Felipe dos Santos e Bento Rangel"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[center_45%] grayscale transition-all duration-1000 ease-in-out hover:scale-105 hover:grayscale-0 sm:object-[center_35%]"
            />
          </div>
        </div>

        <div
          className="reveal flex flex-col justify-center"
          style={
            { '--reveal-x': '20px', '--reveal-y': '0px', '--reveal-step': 1 } as React.CSSProperties
          }
        >
          <h2 className="mb-8 text-5xl leading-[0.9] font-black tracking-tighter uppercase italic sm:text-6xl md:text-7xl">
            Quem <br />
            <span className="text-transparent [-webkit-text-stroke:1px_white]">Somos</span>
          </h2>
          <div className="space-y-6 text-base leading-relaxed font-light text-paper/60 md:text-lg">
            <p>
              A <strong className="font-bold text-paper">Street Stars</strong> nasceu da rua. Da
              vontade de transformar vivência urbana em estilo, em identidade, em movimento.
            </p>
            <p>
              Fundada em 2024 por <span className={founder}>Felipe dos Santos</span> e{' '}
              <span className={founder}>Bento Rangel</span>, a marca nasceu para ocupar seu espaço
              no streetwear nacional.
            </p>
            <p>
              Inspirada pela arquitetura das ruas, pela batida da música e pela estética noturna, a
              gente representa quem se expressa sem pedir permissão.
            </p>
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-line pt-8">
            <div>
              <dt className="mb-1 text-[10px] tracking-[0.2em] text-paper/40 uppercase">Missão</dt>
              <dd className="font-mono text-sm">Fazer brilhar quem já é estrela.</dd>
            </div>
            <div>
              <dt className="mb-1 text-[10px] tracking-[0.2em] text-paper/40 uppercase">
                Fundação
              </dt>
              <dd className="font-mono text-sm">São Paulo, 2024</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
