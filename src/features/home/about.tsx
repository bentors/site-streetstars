import Image from 'next/image'
import { HOME_IMAGES } from './content'

export function About() {
  return (
    <section id="sobre" className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:gap-24">
        <div className="relative aspect-[1000/550] overflow-hidden bg-surface">
          <Image
            src={HOME_IMAGES.about}
            alt="Fundadores da Street Stars — Felipe dos Santos e Bento Rangel"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[center_35%] grayscale transition-all duration-1000 hover:grayscale-0"
          />
        </div>
        <div>
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
              Fundada em 2024 por <span className="text-paper">Felipe dos Santos</span> e{' '}
              <span className="text-paper">Bento Rangel</span>, a marca nasceu para ocupar seu
              espaço no streetwear nacional.
            </p>
            <p>
              Inspirada pela arquitetura das ruas, pela batida da música e pela estética noturna, a
              gente representa quem se expressa sem pedir permissão.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
