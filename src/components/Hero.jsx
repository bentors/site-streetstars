import hero from '../assets/images/hero.webp'
import { motion } from 'framer-motion'
import { scrollToSection } from '../utils/scrollToSection'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0.3
    }
  }
}

const text = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: 'easeOut' }
  }
}

const image = {
  hidden: { scale: 1.1 },
  show: {
    scale: 1,
    transition: { duration: 1.6, ease: 'easeOut' }
  }
}

export default function Hero() {
  return (
    <section id="top"
      className="min-h-screen relative overflow-hidden flex items-center text-center justify-center px-6">
      <motion.img
        src={hero}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        width="1200"
        height="800"
        variants={image}
        initial="hidden"
        animate="show"  
        className="absolute inset-0 w-full h-full object-cover object-[75%_65%] sm:object-[50%_50%] lg:object-[50%_22%]"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/65" />

      <motion.div variants={container}
        initial="hidden"
        animate="show"
        viewport={{ once: true }}
        className="relative max-w-4xl text-center"
      >
        <motion.p variants={text} className="text-xs tracking-[0.35em] text-white/60 mb-6">
          STREET STARS
        </motion.p>

        <motion.h1 variants={text} className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-8">
          Estilo que nasce <br /> nas ruas
        </motion.h1>

        <motion.p variants={text} className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          A Street Stars nasce da rua, da cultura urbana e da expressão individual. <br/>
          Mais do que moda, criamos estrelas.
        </motion.p>

        <motion.div variants={text} className="flex flex-col items-center gap-2">
          <a
            href="https://streetstars.myshopify.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label='Ir para loja da Street Stars'
            className="sm:w-auto px-8 py-4 text-center border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-black hover:scale-[1.03] active:scale-95 duration-300 transition-all"
          >
            Acessar loja oficial
          </a>

        </motion.div>
      </motion.div>
    </section>
  )
}
