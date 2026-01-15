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
          Drops
        </h2>

        <motion.div
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 md:hidden scroll-smooth overscroll-x-contain"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {collections.map((item, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              className="min-w-[85%] snap-center scroll-ml-6"
            >
              <CollectionCard item={item} />
            </motion.div>
          ))}
        </motion.div>

        <p className="text-xs text-white/50 text-center mt-4 md:hidden">
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
    <div className="group h-full flex flex-col border border-white/10 bg-black overflow-hidden transition-all duration-500 ease-out hover:border-white/30 md:hover:s-translate-y-2 md:hover:shadow-2xl md:hover:shadow-black/50">
      <div className="relative w-full aspect-square overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          width="600"
          height="750"
          loading='lazy'
          decoding='async'
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-110"
        />

        <img
          src={item.imageHover}
          alt={`${item.title} - visão alternativa`}
          loading='lazy'
          decoding='async'
          width="600"
          height="750"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 scale-105 group-hover:scale-100"
        />
      </div>

      <div className="p-6 flex flex-col flex-1 transition-transform duration-500 md:group-hover:-translate-y-1">
        <h3 className="font-display text-xl mb-2">
          {item.title}
        </h3>
        <p className="text-white/70 text-sm leading-relaxed flex-1">
          {item.description}
        </p>
      </div>
    </div>
  )
}
