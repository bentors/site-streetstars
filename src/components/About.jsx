import aboutus from '../assets/images/aboutus.webp'
import { motion } from 'framer-motion'

export default function About() {
  return (
    <section id="about" className="py-24 sm:py-32 bg-[#050505] text-white relative overflow-hidden">

      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5 hidden lg:block"></div>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        <div className='relative'>
          <div className="absolute top-4 -left-4 w-full h-full border border-white/20 hidden md:block z-0"></div>
          
          <motion.div
            className="relative z-10 overflow-hidden bg-zinc-900"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <motion.img
              src={aboutus}
              alt="Equipe Street Stars - Felipe e Bento"
              loading="lazy"
              className="w-full h-[400px] md:h-[550px] object-cover grayscale hover:grayscale-0 hover:scale-105 transition-all duration-1000 ease-in-out"
            />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center"
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8">
            Quem <br/>
            <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>Somos</span>
          </h2>
          
          <div className="space-y-6 text-base md:text-lg text-white/60 font-light leading-relaxed text-justify">
            <p>
              A <strong className="text-white font-bold">Street Stars</strong> nasceu da rua. Da vontade de transformar vivência urbana em estilo, em identidade, em movimento.
            </p>
            <p>
              Fundada em 2024 por <span className="text-white border-b border-white/30 pb-0.5 hover:border-white transition-colors cursor-default">Felipe dos Santos</span> e <span className="text-white border-b border-white/30 pb-0.5 hover:border-white transition-colors cursor-default">Bento Rangel</span>, a marca nasceu para ocupar seu espaço no streetwear nacional.
            </p>
            <p>
              Inspirada pela arquitetura das ruas, pela batida da música e pela estética noturna, a gente representa quem se expressa sem pedir permissão.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-12 pt-8 border-t border-white/10">
            <div>
               <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Missão</h3>
               <p className="font-mono text-sm text-white">Fazer brilhar quem já é estrela.</p>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Fundação</h3>
              <p className="font-mono text-sm text-white">São Paulo, 2024.</p>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  )
}