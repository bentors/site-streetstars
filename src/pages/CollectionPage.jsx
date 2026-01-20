import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collections } from '../data/collections.js' 

const CloseIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
)

export default function CollectionPage() {
  const { id } = useParams()
  const collectionIndex = parseInt(id)
  const collection = collections[collectionIndex]

  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => { 
    window.scrollTo(0, 0) 
  }, [id])

  if (!collection) return null

  const galleryImages = collection.gallery || [collection.image, collection.imageHover, collection.image, collection.imageHover].filter(Boolean)

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button className="absolute top-6 right-6 p-2 hover:rotate-90 transition-transform">
              <CloseIcon />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selectedImage} 
              alt="Zoom" 
              className="max-h-[90vh] max-w-[95vw] object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>


      <div className="max-w-7xl mx-auto px-6 pt-28 md:pt-40 pb-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start mb-24">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 lg:sticky lg:top-32"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900 border border-white/10">
              <img src={collection.image} alt={collection.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-white/90">Capa do Editorial</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-7 flex flex-col justify-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <Link to="/" state={{ scrollTo: 'collections' }} className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar para Coleções
              </Link>
              <span className="text-[10px] uppercase tracking-widest text-white/30 hidden sm:block">Drop 0{collectionIndex + 1}</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8 text-white">
              {collection.title}
            </h1>

            <div className="space-y-6 mb-12">
               <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed border-l-2 border-white pl-6">
                 {collection.shortDescription || collection.description}
               </p>
               <div className="text-white/60 text-sm leading-loose text-justify whitespace-pre-line font-light">
                 {collection.fullDescription || collection.description}
               </div>
            </div>

            <Link to="/" state={{ scrollTo: 'shop' }} className="group relative w-full md:w-auto py-5 px-8 border border-white text-center overflow-hidden transition-all hover:bg-white inline-block">
               <span className="relative z-10 text-xs font-black uppercase tracking-[0.25em] text-white group-hover:text-black transition-colors">Ver Peças Disponíveis</span>
               <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"/>
            </Link>
          </motion.div>
        </div>

        <div className="border-t border-white/10 pt-20">
          <div className="flex items-center gap-4 mb-12">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter">Lookbook</h3>
             <div className="h-px flex-1 bg-white/20"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {galleryImages.map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                onClick={() => setSelectedImage(img)}
                className={`
                  relative group cursor-zoom-in overflow-hidden bg-zinc-900 border border-white/5
                  ${index % 3 === 0 ? 'md:row-span-2 aspect-[3/4]' : 'aspect-square'}
                `}
              >
                <img 
                  src={img} 
                  alt={`Look ${index + 1}`} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                />

                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] uppercase tracking-widest bg-white text-black px-2 py-1 font-bold">
                    Expandir
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}