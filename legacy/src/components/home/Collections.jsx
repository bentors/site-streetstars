import { useState, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { collections } from '../../data/collections.js'
import { Link } from 'react-router-dom' 
import { optimizeImage, generateSrcSet } from '../../utils/image'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
  }
}

export default function Collections() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef(null)

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      
      let newIndex = 0;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        newIndex = collections.length - 1;
      } else {
        newIndex = Math.round(scrollLeft / (clientWidth * 0.85));
        newIndex = Math.min(newIndex, collections.length - 1);
      }
      
      setCurrentIndex(prev => (prev === newIndex ? prev : newIndex));
    }
  }, [])

  const scrollToItem = useCallback((index) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstChild.offsetWidth + 16
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      })
    }
  }, [])

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
          
          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] max-w-xs md:text-right">
              Nossos drops, nossa história. <br/>
              Explore cada coleção que já lançamos.
            </p>
          </div>
        </div>

        <motion.div
          ref={scrollRef}
          onScroll={handleScroll}
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="
            flex gap-4 overflow-x-auto snap-x snap-mandatory pb-8 -mx-6 px-6 
            md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:mx-0 md:px-0
            scrollbar-hide
          "
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            willChange: 'scroll-position' 
          }} 
        >
          {collections.map((item, index) => (
            <motion.div
              key={item.id || index}
              variants={itemVariant}
              className="min-w-[85%] sm:min-w-[45%] md:min-w-0 snap-center h-full"
            >
              <CollectionCard item={item} index={index} />
            </motion.div>
          ))}
        </motion.div>

        {collections.length > 1 && (
          <div className="md:hidden flex justify-center mt-2 gap-2">
            {collections.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToItem(index)}
                aria-label={`Ir para coleção ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out
                  ${currentIndex === index 
                    ? 'w-8 bg-white'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}

function CollectionCard({ item, index }) {
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"])

  return (
    <article ref={ref} className="group h-full overflow-hidden">
      <Link 
        to={`/collection/${index}`} 
        className="block relative h-full aspect-[3/4]"
      >
        <div className="relative w-full h-full overflow-hidden bg-zinc-900 border border-white/5">

          <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
            <img
              src={optimizeImage(item.image, 800)}
              srcSet={generateSrcSet(item.image)}
              sizes="(max-width: 768px) 85vw, 33vw"
              alt={item.title}
              width={800}
              height={1067}
              loading='lazy'
              decoding="async"
              className="w-full h-full object-cover transition-opacity duration-700 group-hover:opacity-0"
            />
            
            {item.imageHover && (
              <img
                src={optimizeImage(item.imageHover, 800)}
                srcSet={generateSrcSet(item.imageHover)}
                sizes="(max-width: 768px) 85vw, 33vw"
                alt=""
                width={800}
                height={1067}
                loading='lazy'
                decoding="async"
                fetchPriority="low"
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              />
            )}
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 pointer-events-none" />

          <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <span className="text-[9px] border border-white/30 px-2 py-1 uppercase tracking-widest bg-black/30 backdrop-blur-sm">
                Drop 0{index + 1}
              </span>
              <span className="text-[18px] opacity-50 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                ↗
              </span>
            </div>

            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <h3 className="font-display text-2xl uppercase italic leading-none mb-2 text-white drop-shadow-md">
                {item.title}
              </h3>

              <div className="w-0 group-hover:w-full h-[1px] bg-white transition-all duration-700 mb-3" />
              
              <p className="text-[10px] text-white/70 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                Ver Editorial
              </p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}