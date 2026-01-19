import manifestoBg from '../assets/images/manifesto-bg.webp'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2
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
    y: 0,
    transition: { duration: 0.9, ease: 'easeOut', delay: 0.2 }
  }
}

export default function Manifesto() {
  return (
    <section
      id="manifesto" 
      className="relative min-h-[100svh] py-20 sm:py-28 lg:py-32 px-6 overflow-hidden"
    >
      <img
        src={manifestoBg}
        alt=""
        loading="lazy"
        decoding='async'
        className="absolute inset-0 w-full h-full object-cover object-center lg:object-[50%_12%] z-0"
      />

      <div className="absolute inset-0 bg-black/40"></div>

      <motion.div className="relative max-w-4xl mx-auto space-y-20 text-center"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}>

        <div className="space-y-6 mb-24">
          <motion.p variants={line}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white/70 leading-tight">
            A rua é palco. 
          </motion.p>
          <motion.p variants={line} 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white/85 leading-tight">
            O corpo é voz.
          </motion.p>
          <motion.p variants={line} 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            A roupa é mensagem.
          </motion.p>
        </div>
          
        <motion.div variants={box} 
          className="bg-black/40 backdrop-blur-sm p-8 sm:p-10 rounded-2xl border border-white/10">

          <p className="text-xl sm:text-2xl text-white/95 leading-relaxed">
            A Street Stars acredita que estilo é extensão da identidade. 
            <span className="block mt-4 text-white/80">
              Vestir Street Stars é viver a rua.
            </span>
          </p>
        </motion.div>



        <motion.div className="flex flex-col items-center gap-2">

          <p className="text-[8px] text-white/40 uppercase tracking-[0.2em]">
            Pronto para se tornar uma estrela das ruas?
          </p>

          <a
            href="https://streetstars.myshopify.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label='Ir para loja da Street Stars'
            className="group relative px-10 py-4 overflow-hidden rounded-full sm:w-auto text-center border border-white text-white font-semibold hover:bg-white hover:text-black hover:scale-[1.03] active:scale-95 duration-300 transition-all"
          >
            Acessar loja oficial
          </a>

        </motion.div>

      </motion.div>
    </section>
  )
}