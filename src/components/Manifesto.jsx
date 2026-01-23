import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import manifestoBgDesktop from '../assets/images/manifesto-bg.webp'
import manifestoBgMobile from '../assets/images/manifesto-bg-mobile.webp'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.4 }
  }
}

const textReveal = {
  hidden: { 
    opacity: 0, 
    y: 50,
    color: 'rgba(255, 255, 255, 0)',
    WebkitTextStroke: '1px rgba(255, 255, 255, 0.5)'
  },
  show: {
    opacity: 1, 
    y: 0,
    color: 'rgba(255, 255, 255, 1)',
    WebkitTextStroke: '0px rgba(255, 255, 255, 0)',
    transition: { 
      duration: 1.0, 
      ease: [0.22, 1, 0.36, 1]
    }
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
    y: 1,
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
        <motion.div style={{ y }} className="w-full h-[120%] -top-[01%] relative">
          <img
            src={manifestoBgMobile}
            alt="Manifesto background"
            loading="lazy"
            className="block md:hidden w-full h-full object-cover  object-[60%_center] contrast-125 opacity-50" 
          />
          <img
            src={manifestoBgDesktop}
            alt="Manifesto background"
            loading="lazy"
            className="hidden md:block w-full h-full object-cover contrast-125 opacity-50" 
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
      </div>

      <div className="absolute top-0 left-0 w-full overflow-hidden py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm z-20">
        <motion.div 
          className="flex whitespace-nowrap text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold text-white/60"
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          {Array(8).fill("Street Stars ★ Be a star").map((item, i) => (
            <span key={i} className="mx-6">{item}</span>
          ))}
        </motion.div>
      </div>

      <motion.div 
        className="relative z-10 max-w-4xl mx-auto space-y-20 text-center mt-10"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: "0.3" }}
      >

        <div className="space-y-4 md:space-y-6 mb-24 mix-blend-screen">
          <motion.p variants={line}
            className="text-3xl sm:text-4xl md:text-6xl font-black text-white/60 tracking-tighter leading-none italic uppercase">
            A rua é palco. 
          </motion.p>
          <motion.p variants={line} 
            className="text-3xl sm:text-4xl md:text-6xl font-black text-white/80 tracking-tighter leading-none italic uppercase">
            O corpo é voz.
          </motion.p>
          <motion.p variants={line} 
            className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
            A roupa é mensagem.
          </motion.p>
        </div>
          
        <motion.div variants={box} 
          className="bg-black/40 backdrop-blur-md p-8 sm:p-12 rounded-md border border-white/10 max-w-2xl mx-auto"
        >
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed font-light">
            A Street Stars acredita que estilo é extensão da identidade. 
            Não seguimos tendências, criamos movimentos. 
            <span className="block mt-4 text-white font-bold uppercase tracking-widest text-sm md:text-base">
              Vestir Street Stars é viver a rua. Ser a estrela.
            </span>
          </p>
        </motion.div>

        <motion.div variants={box} className="flex flex-col items-center gap-4 mt-12">
          <p className="text-[10px] text-white/50 uppercase tracking-[0.3em]">
            Pronto para se tornar uma estrela das ruas?
          </p>

          <button
            onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label='Ir para loja da Street Stars'
            className="group relative px-10 py-4 overflow-hidden rounded-full sm:w-auto text-center border border-white text-white font-bold uppercase tracking-[0.1em] text-xs hover:bg-white hover:text-black transition-all duration-300"
          >
            Acessar Shop
          </button>
        </motion.div>

      </motion.div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block">
         <div className="writing-vertical-rl text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold rotate-180">
            Est. 2024 — São Paulo — Brasil
         </div>
      </div>
    </section>
  )
}