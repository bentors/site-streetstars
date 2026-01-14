import aboutus from '../assets/images/aboutus.jpg'
import { motion } from 'framer-motion'

export default function About() {
  return (
    <section id="about" 
      className="py-20 sm:py-28 lg:py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        <div className='relative overflow-hidden'>
          <motion.img
            src={aboutus}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            viewport={{ once: true }}
            alt="Equipe Street Stars"
            className="w-full h-64 sm:h-80 md:h-[420px] object-cover object-[75%_5%] sm:object-[48%_100%] grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display mb-6">
            Nossa história
          </h2>
          
          <p className="text-white/70 leading-relaxed text-balance">
            A Street Stars surgiu da vontade de transformar vivências urbanas em vestuário.
            Inspirada pela rua, música e cultura street, representamos quem se expressa
            sem pedir permissão.
          </p>
        </motion.div>

      </div>
    </section>
  )
}
