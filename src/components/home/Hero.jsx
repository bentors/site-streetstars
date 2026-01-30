import { optimizeImage } from '../../utils/image'
const HERO_URL = "https://res.cloudinary.com/dmsvju9ca/image/upload/v1769638546/hero_rb9jvq.jpg"
import { motion } from 'framer-motion'
import { scrollToSection } from '../../utils/scrollToSection'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

export const text = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
}

const image = {
  hidden: { scale: 1.1 },
  show: {
    scale: 1,
    transition: { duration: 2, ease: 'easeOut' }
  }
}

export default function Hero() {
  return (
    <section id="top"
      className="min-h-screen relative overflow-hidden flex items-center text-center justify-center px-6">
      <motion.img
        src={optimizeImage(HERO_URL, 1500)}
        alt="Street Stars Hero"
        aria-hidden="true"
        fetchPriority="high"
        loading="eager"
        variants={image}
        initial="hidden"
        animate="show"  
        className="absolute inset-0 w-full h-full object-cover opacity-90 object-[55%_65%] sm:object-[50%_20%] lg:object-[50%_18%]"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/65" />

      <motion.div variants={container}
        initial="hidden"
        animate="show"
        className="relative max-w-4xl z-10 text-center"
      >
        <motion.p variants={text} className="text-xs lg:text-xl tracking-[0.35em] text-white/60 mb-6">
          STREET STARS
        </motion.p>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter uppercase">
          Estrelas nascem <br /> nas ruas
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          A Street Stars nasce da rua, da cultura urbana e da expressão individual. <br className='hidden sm:block'/>
          Mais do que moda, vestimos estrelas.
        </p>

        <motion.div variants={text} className="flex flex-col items-center gap-6">
          <button
            onClick={() => scrollToSection('#shop')}
            aria-label='Ir para loja da Street Stars'
            className="group relative px-10 py-4 overflow-hidden rounded-full sm:w-auto text-center border border-white text-white font-semibold hover:bg-white hover:text-black hover:scale-[1.03] active:scale-95 duration-300 transition-all"
          >
            Ver Itens
          </button>

        <p className="text-[8px] text-white/30 tracking-[0.2em]">
          ★ Feito por quem vive a rua ★
        </p>

        </motion.div>
      </motion.div>
    </section>
  )
}
