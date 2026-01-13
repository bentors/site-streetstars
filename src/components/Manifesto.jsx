import manifestoBg from '../assets/images/manifesto-bg.jpg'
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
      className="py-20 sm:py-28 lg:py-32 px-6 text-center"
      style={{ 
        backgroundImage: `url(${manifestoBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 12%',
      }}
    >

      <motion.div className="max-w-4xl mx-auto space-y-20"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}>

        <div className="space-y-6 mb-24">
          <motion.p variants={line} className="text-3xl sm:text-4xl md:text-5xl font-bold text-black/60 leading-tight">
            A rua é palco. 
          </motion.p>
          <motion.p variants={line} className="text-3xl sm:text-4xl md:text-5xl font-bold text-black/80 leading-tight">
            O corpo é voz.
          </motion.p>
          <motion.p variants={line} className="text-3xl sm:text-4xl md:text-5xl font-bold text-black leading-tight">
            A roupa é mensagem.
          </motion.p>
        </div>
          
        <motion.div variants={box} className="bg-black/40 backdrop-blur-sm p-8 sm:p-10 rounded-2xl border border-white/10">
          <p className="text-xl sm:text-2xl text-white/95 leading-relaxed">
            A Street Stars acredita que estilo é extensão da identidade. 
            <span className="block mt-4 text-white/80">
              Não seguimos padrões, criamos presença. Vestir Street Stars é viver a rua. Refletir momentos, ideias e vivências.
            </span>
          </p>
        </motion.div>

      </motion.div>
    </section>
  )
}