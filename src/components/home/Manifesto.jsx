import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { optimizeImage, generateSrcSet } from '../../utils/image'

const BG_MOBILE_URL = "https://res.cloudinary.com/dmsvju9ca/image/upload/v1769639102/manifesto-mobile_ozgxrb.jpg"
const BG_DESKTOP_URL = "https://res.cloudinary.com/dmsvju9ca/image/upload/v1769639101/manifesto-desktop_jitoun.jpg"

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.4 }
  }
}

const line = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  }
}

const box = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut', delay: 0.6 }
  }
}

export default function Manifesto() {
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"])

  return (
    <section
      id="manifesto" 
      ref={containerRef}
      className="relative min-h-screen py-32 px-6 overflow-hidden flex items-center justify-center bg-black"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          style={{ y }} 
          className="w-full h-[120%] -top-[10%] relative"
        >
          <picture>
            <source 
              media="(min-width: 768px)" 
              srcSet={generateSrcSet(BG_DESKTOP_URL)}
              sizes="100vw"
            />
            <img
              src={optimizeImage(BG_MOBILE_URL, 800)} 
              srcSet={generateSrcSet(BG_MOBILE_URL)}
              sizes="100vw"
              alt="Textura urbana e estilo street wear"
              width={1500}
              height={1000}
              loading="lazy"
              className="w-full h-full object-cover contrast-125 opacity-50" 
            />
          </picture>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" aria-hidden="true" />
      </div>

      <div className="absolute top-0 left-0 w-full overflow-hidden py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm z-20">
        <div className="flex whitespace-nowrap text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold text-white/60">
          {Array(20).fill("Street Stars ★ Be a star").map((item, i) => (
            <motion.span 
              key={i} 
              className="mx-6"
              animate={{ x: [0, -2000] }}
              transition={{ 
                repeat: Infinity, 
                ease: "linear", 
                duration: 40,
                repeatType: "loop"
              }}
            >
              {item}
            </motion.span>
          ))}
        </div>
      </div>

      <motion.div 
        className="relative z-10 max-w-4xl mx-auto space-y-20 text-center mt-10"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >

        <header className="space-y-4 md:space-y-6 mb-24">
          <motion.h1 variants={line}
            className="text-3xl sm:text-4xl md:text-6xl font-black text-white/60 tracking-tighter leading-none italic uppercase">
            A rua é palco. 
          </motion.h1>
          <motion.p variants={line} 
            className="text-3xl sm:text-4xl md:text-6xl font-black text-white/80 tracking-tighter leading-none italic uppercase">
            O corpo é voz.
          </motion.p>
          <motion.p variants={line} 
            className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
            A roupa é mensagem.
          </motion.p>
        </header>

        <motion.div variants={box} 
          className="bg-black/40 backdrop-blur-md p-8 sm:p-12 rounded-md border border-white/10 max-w-2xl mx-auto"
        >
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed font-light">
            A Street Stars acredita que estilo é extensão da identidade. 
            Não seguimos tendências, criamos movimentos. 
          </p>
          <p className="block mt-6 text-white font-bold uppercase tracking-widest text-sm md:text-base">
            Vestir Street Stars é viver a rua. Ser a estrela.
          </p>
        </motion.div>

        <motion.div variants={box} className="flex flex-col items-center gap-4 mt-12">
          <p className="text-[10px] text-white/50 uppercase tracking-[0.3em]">
            Pronto para se tornar uma estrela das ruas?
          </p>

          <button
            onClick={() => {
              const shop = document.getElementById('shop')
              if (shop) {
                shop.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            aria-label='Ir para loja da Street Stars'
            className="group relative px-10 py-4 overflow-hidden rounded-full border border-white text-white font-bold uppercase tracking-[0.1em] text-xs hover:bg-white hover:text-black transition-all duration-300"
          >
            Acessar Shop
          </button>
        </motion.div>

      </motion.div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block" aria-hidden="true">
        <div className="writing-vertical-rl text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold rotate-180">
          Est. 2024 — São Paulo — Brasil
        </div>
      </div>
    </section>
  )
}