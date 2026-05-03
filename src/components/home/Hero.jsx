import { memo, useEffect } from 'react'
import { optimizeImage } from '../../utils/image'
import { scrollToSection } from '../../utils/scrollToSection'

const HERO_URL = "https://res.cloudinary.com/dmsvju9ca/image/upload/v1769638546/hero_rb9jvq.jpg"

function Hero() {
  const mobileSrc = optimizeImage(HERO_URL, 600)
  const desktopSrc = optimizeImage(HERO_URL, 1500)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.removeLoader) window.removeLoader()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      id="top"
      aria-label="Seção principal"
      className="min-h-screen relative overflow-hidden flex items-center text-center justify-center px-6"
    >
      <picture className="absolute inset-0 w-full h-full">
        <source media="(max-width: 768px)" srcSet={mobileSrc} />
        <source media="(min-width: 769px)" srcSet={desktopSrc} />
        <img
          src={desktopSrc}
          alt="Jovens vestindo roupas Street Stars"
          width={1500}
          height={1000}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover opacity-90 object-[55%_65%] sm:object-[50%_20%] lg:object-[50%_18%] animate-hero-zoom"
          style={{ objectFit: 'cover', opacity: 1, visibility: 'visible' }}
        />
      </picture>

      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/65" aria-hidden="true" />

      <div className="relative max-w-4xl z-10 text-center animate-fadeInUp">
        <p className="text-xs lg:text-xl tracking-[0.35em] text-white/60 mb-6">
          STREET STARS
        </p>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter uppercase">
          Estrelas nascem <br /> nas ruas
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          A Street Stars nasce da rua, da cultura urbana e da expressão individual.{' '}
          <br className="hidden sm:block" />
          Mais do que moda, transformamos quem veste em estrela.
        </p>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-row items-center gap-3">
            <button
              onClick={() => scrollToSection('#shop')}
              aria-label="Comprar agora na Street Stars"
              className="px-8 py-4 sm:px-10 sm:py-4 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:bg-zinc-200 hover:scale-[1.03] active:scale-95 duration-300 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            >
              Comprar Agora
            </button>
            <button
              onClick={() => scrollToSection('#collections')}
              aria-label="Ver coleções da Street Stars"
              className="px-8 py-4 sm:px-10 sm:py-4 rounded-full border border-white/40 text-white/80 text-sm sm:text-base font-semibold hover:border-white hover:text-white hover:scale-[1.02] active:scale-95 duration-300 transition-all"
            >
              Ver Coleções
            </button>
          </div>

          <p className="text-[8px] text-white/30 tracking-[0.2em]">
            ★ Feito por quem vive a rua ★
          </p>
        </div>
      </div>
    </section>
  )
}

export default memo(Hero)