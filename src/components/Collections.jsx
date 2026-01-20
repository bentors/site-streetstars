import { motion } from 'framer-motion'
import { collections } from '../data/collections.js'
import { Link } from 'react-router-dom' 

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  }
}

export default function Collections() {
  return (
    <section
      id="collections"
      className="py-24 bg-neutral-950 text-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
            Visual <br/>
            <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>Archive</span>
          </h2>
          
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] max-w-xs md:text-right">
            Explore nossas campanhas e editoriais passados. <br/>
            A história da Street Stars através das lentes.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="
            flex gap-4 overflow-x-auto snap-x snap-mandatory pb-8 -mx-6 px-6 
            md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:mx-0 md:px-0
            scrollbar-hide
          "
        >
          {collections.map((item, index) => (
            <motion.div
              key={index}
              alt={`Coleção ${item.title}`}
              variants={itemVariant}
              className="min-w-[85%] sm:min-w-[45%] md:min-w-0 snap-center"
            >
              <CollectionCard item={item} index={index} />
            </motion.div>
          ))}
        </motion.div>

        <div className="md:hidden flex justify-center mt-4 gap-1">
          <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <div className="w-1 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </section>
  )
}

function CollectionCard({ item, index }) {
  return (
    <div className="group relative cursor-pointer block">
      <Link to={`/collection/${index}`} aria-label='Ir para coleção' className="block group relative cursor-pointer">
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900 border border-white/5">

          <img
            src={item.image}
            alt={item.title}
            loading='lazy'
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-0"
          />

          <img
            src={item.imageHover}
            alt={item.title}
            loading='lazy'
            className="absolute inset-0 w-full h-full object-cover opacity-0 scale-110 transition-all duration-700 group-hover:opacity-100 group-hover:scale-100"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

          <div className="absolute inset-0 p-6 flex flex-col justify-between">

            <div className="flex justify-between items-start">
              <span className="text-[9px] border border-white/30 px-2 py-1 uppercase tracking-widest bg-black/30 backdrop-blur-sm">
                Drop 0{index + 1}
              </span>
              <span className="text-[18px]">↗</span>
            </div>

            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="font-display text-2xl uppercase italic leading-none mb-2">
                {item.title}
              </h3>

              <div className="w-0 group-hover:w-full h-[1px] bg-white transition-all duration-700 mb-3" />
              
              <p className="text-[10px] text-white/70 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Ver Editorial Completo
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}