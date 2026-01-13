import hero from '../assets/images/hero.jpg'
import { motion } from 'framer-motion'

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
    <section className="min-h-screen relative overflow-hidden flex items-center text-center justify-center px-6">
      <img
        src={hero}
        alt=''
        aria-hidden="true"
        variants={image}
        initial="hidden"
        animate="show"  
        className="absolute inset-0 w-full h-full object-cover object-[75%_65%] sm:object-[50%_50%] lg:object-[50%_22%]"
      />

      <div className="absolute inset-0 bg-black/60" />

      <motion.div variants={container}
        initial="hidden"
        animate="show"
        className="relative max-w-4xl text-center"
      >
        <motion.p variants={text} className="text-xs tracking-[0.35em] text-white/50 mb-6">
          STREET STARS
        </motion.p>

        <motion.h1 variants={text} className="text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-8">
          Estrelas nascem <br /> nas ruas
        </motion.h1>

        <motion.p variants={text} className="text-white/70 max-w-2xl mx-auto mb-10">
          A Street Stars nasce da rua, da cultura urbana e da expressão individual. <br/>
          Mais do que roupas, criamos identidade.
        </motion.p>

        <motion.div variants={text}>
          <a
            href="#collections"
            className="px-8 py-3 bg-white text-black font-semibold hover:scale-105 transition rounded-md hover:scale-105 transition"
          >
            Conheça as coleções
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
