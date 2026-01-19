import { motion } from 'framer-motion'
import look1 from '../assets/images/shop-1.webp'
import look2 from '../assets/images/shop-2.webp'
import look3 from '../assets/images/shop-3.webp'
import look4 from '../assets/images/shop-4.webp'

export default function Shop() {
  return (
    <section
      id="shop"
      className="relative py-20 sm:py-28 px-6 bg-gradient-to-b from-zinc-800 to-black-900 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-3xl sm:text-4xl font-display mb-4">
          Loja Street Stars
        </h2>
        
        <div className="grid grid-cols-2 gap-4 sm:gap-6 my-10">
            {[look1, look2, look3, look4].map((img, i) => (
                <div
                    key={i}
                    className="relative aspect-[3/2] overflow-hidden rounded-xl border border-white/10"
                >
                <img
                    src={img}
                    alt="Street Stars — coleção urbana"
                    loading="lazy"
                    width="400"
                    height="400"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
            </div>
            ))}
        </div>

        <p className="text-white/70 mb-8">
          Se torne uma estrela das ruas com Street Stars. <br />
          Plataforma segura, pagamento protegido e entrega para todo o Brasil.
        </p>

        <a
          href="https://streetstars.myshopify.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label='Ir para loja da Street Stars'
          className="group relative px-10 py-4 overflow-hidden rounded-full sm:w-auto text-center border border-white text-white font-semibold hover:bg-white hover:text-black hover:scale-[1.03] active:scale-95 duration-300 transition-all"
        >
          Ir para a loja
        </a>

        <p className="text-[8px] text-white/30 tracking-[0.2em] mt-8">
          🛒 Loja oficial ★ Envio nacional ★ Checkout seguro 🔒
        </p>
      </motion.div>
    </section>
  )
}
