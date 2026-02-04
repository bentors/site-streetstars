import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { collections } from '../data/collections.js'
import { optimizeImage, generateSrcSet } from '../utils/image'

export default function CollectionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const collectionIndex = parseInt(id, 10)
  const collection = collections[collectionIndex]

  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => { 
    window.scrollTo(0, 0) 
  }, [id])

  useEffect(() => {
    if (!collection) {
      navigate('/', { replace: true })
    }
  }, [collection, navigate])

  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage])

  const handleImageZoom = useCallback((img) => {
    setSelectedImage(img)
  }, [])

  const handleCloseZoom = useCallback(() => {
    setSelectedImage(null)
  }, [])

  if (!collection) return null

  const galleryImages = collection.gallery || 
    [collection.image, collection.imageHover, collection.image, collection.imageHover].filter(Boolean)

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">

      <Helmet>
        <title>{collection.title} - Street Stars Collections</title>
        <meta 
          name="description" 
          content={collection.shortDescription || `Confira o editorial ${collection.title} da Street Stars.`} 
        />
        <meta property="og:title" content={`${collection.title} - Lookbook Street Stars`} />
        <meta property="og:description" content={collection.shortDescription} />
        <meta property="og:image" content={optimizeImage(collection.image, 1200)} />
        <meta property="og:type" content="article" />
      </Helmet>

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseZoom}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
            role="dialog"
            aria-modal="true"
            aria-label="Zoom da imagem"
          >
            <button 
              onClick={handleCloseZoom}
              aria-label="Fechar zoom"
              className="absolute top-6 right-6 p-2 hover:rotate-90 transition-transform text-white/80 hover:text-white"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={optimizeImage(selectedImage, 1500)}
              srcSet={generateSrcSet(selectedImage)}
              sizes="95vw"
              alt="Imagem do editorial em tamanho ampliado"
              width={1500}
              height={2000}
              className="max-h-[90vh] max-w-[95vw] object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 pt-28 md:pt-40 pb-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-24 mb-24">

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6"
          >
            <div className="relative aspect-[3/4] md:aspect-[16/9] lg:aspect-[3/4] overflow-hidden bg-zinc-900 border border-white/10">
              <img 
                src={optimizeImage(collection.image, 1000)}
                srcSet={generateSrcSet(collection.image)}
                sizes="(max-width: 1024px) 100vw, 50vw"
                alt={`Capa da coleção ${collection.title}`}
                width={1000}
                height={1333}
                fetchPriority="high"
                loading="eager"
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-white/90">
                  Capa do Editorial
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-6 flex flex-col justify-start h-full"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <Link 
                to="/" 
                state={{ scrollTo: 'collections' }} 
                className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> 
                Voltar para Coleções
              </Link>
              <span className="text-[10px] uppercase tracking-widest text-white/30 hidden sm:block">
                Drop 0{collectionIndex + 1}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8 text-white">
              {collection.title}
            </h1>

            <div className="space-y-6 mb-12">
              <blockquote className="text-sm md:text-xl text-white/90 font-light leading-relaxed border-l-2 border-white pl-6">
                {collection.shortDescription || collection.description}
              </blockquote>

              {collection.fullDescription && (
                <div className="text-white/60 text-sm leading-loose space-y-4 font-light text-justify">
                  {Array.isArray(collection.fullDescription) ? (
                    collection.fullDescription.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                  ) : (
                    <p>{collection.fullDescription}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto">
              <Link 
                to="/" 
                state={{ scrollTo: 'shop' }} 
                className="group relative w-full py-5 px-8 border border-white text-center overflow-hidden transition-all hover:bg-white block"
              >
                <span className="relative z-10 text-xs font-black uppercase tracking-[0.25em] text-white group-hover:text-black transition-colors">
                  Ver Peças Disponíveis
                </span>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </Link>
            </div>
          </motion.div>
        </div>

        <section className="border-t border-white/10 pt-20">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Lookbook</h2>
            <div className="h-px flex-1 bg-white/20" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {galleryImages.map((img, index) => (
              <motion.article
                key={`${img}-${index}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                onClick={() => handleImageZoom(img)}
                className={`
                  relative group cursor-zoom-in overflow-hidden bg-zinc-900 border border-white/5
                  ${index % 3 === 0 ? 'md:row-span-2 aspect-[3/4]' : 'aspect-square'}
                `}
              >
                <img 
                  src={optimizeImage(img, 800)}
                  srcSet={generateSrcSet(img)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  alt={`Look ${index + 1} da coleção ${collection.title}`}
                  width={800}
                  height={index % 3 === 0 ? 1067 : 800}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 md:grayscale group-hover:grayscale-0" 
                />

                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" aria-hidden="true" />

                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] uppercase tracking-widest bg-white text-black px-2 py-1 font-bold">
                    Expandir
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}