import { collections } from '../data/collections'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15
    }
  }
}

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

export default function Collections() {
  return (
    <section
      id="collections"
      className="py-20 sm:py-28 lg:py-32 px-6 bg-neutral-950"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display mb-16 text-center">
          Coleções
        </h2>

        <motion.div
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 px-2 md:hidden touch-pan-x scrollbar-hide"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {collections.map((item, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              className="min-w-[85%] snap-center"
            >
              <CollectionCard item={item} />
            </motion.div>
          ))}
        </motion.div>

        <p className="text-xs text-white/40 text-center mt-4 md:hidden">
          Arraste para ver mais →
        </p>

        <motion.div
          className="hidden md:grid md:grid-cols-3 gap-10"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {collections.map((item, index) => (
            <motion.div key={index} variants={cardVariant}>
              <CollectionCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CollectionCard({ item }) {
  return (
    <div className="group h-full flex flex-col border border-white/10 overflow-hidden bg-black transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:border-white/30">
      <div className="relative w-full aspect-square overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="relative w-full aspect-square overflow-hidden inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:opacity-0 group-hover:scale-[1.03]"
        />

        <img
          src={item.imageHover}
          alt={`${item.title} - visão alternativa`}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 scale-105 group-hover:scale-100"
        />
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-xl mb-2">
          {item.title}
        </h3>
        <p className="text-white/60 text-sm leading-relaxed flex-1">
          {item.description}
        </p>
      </div>
    </div>
  )
}
