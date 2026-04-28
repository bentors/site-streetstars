import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { useCart } from '../context/CartContext.jsx'
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore/lite'
import { db } from '../services/firebase.js'
import Loading from '../components/Loading'
import { formatCurrency } from '../utils/format'
import { optimizeImage, generateSrcSet } from '../utils/image'

const MAX_CACHE_SIZE = 20
const relatedCache = new Map()

function setRelatedCache(key, value) {
  if (relatedCache.size >= MAX_CACHE_SIZE) {
    // Remove a entrada mais antiga (primeira inserida)
    relatedCache.delete(relatedCache.keys().next().value)
  }
  relatedCache.set(key, value)
}

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, setIsCartOpen } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [error, setError] = useState(null)

  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const sliderRef = useRef(null)

  const handleBack = useCallback(() => {
    navigate('/', { state: { scrollTo: 'shop' } })
  }, [navigate])

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setError(null)
      
      try {
        const docRef = doc(db, "products", id)
        const snapshot = await getDoc(docRef)

        if (snapshot.exists()) {
          const data = snapshot.data()
          setProduct({ id: snapshot.id, ...data })
          setSelectedSize(null)
          setSelectedColor(null)
          setCurrentImageIndex(0)
          
          window.scrollTo(0, 0)

          loadRelated(data.category, snapshot.id)
        } else {
          setError('Produto não encontrado')
          setProduct(null)
        }
      } catch (error) {
        console.error("Erro ao carregar produto:", error)
        setError('Erro ao carregar produto. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  async function loadRelated(category, currentId) {
    const cacheKey = `${category}-${currentId}`

    if (relatedCache.has(cacheKey)) {
      setRelatedProducts(relatedCache.get(cacheKey))
      return
    }

    try {
      const productsRef = collection(db, "products")
      const q = query(productsRef, where("category", "==", category), where("isActive", "==", true), limit(5))
      const snapshot = await getDocs(q)
      
      const list = []
      snapshot.forEach(doc => {
        if(doc.id !== currentId) {
          list.push({ id: doc.id, ...doc.data() })
        }
      })
      
      const related = list.slice(0, 4)
      setRelatedProducts(related)
      setRelatedCache(cacheKey, related)
    } catch(err) {
      console.error("Erro ao carregar relacionados", err)
    }
  }

  const images = product?.gallery || (product ? [product.img] : [])
  const mainImagePreload = images.length > 0 ? optimizeImage(images[0], 1000) : null

  useEffect(() => {
    if (selectedColor?.img && sliderRef.current) {
      const colorImgIndex = images.findIndex(img => img === selectedColor.img)
      if (colorImgIndex !== -1) {
        sliderRef.current.scrollTo({
          left: colorImgIndex * sliderRef.current.clientWidth,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedColor, images])

  const handleScroll = useCallback(() => {
    if (sliderRef.current) {
      const scrollPosition = sliderRef.current.scrollLeft
      const width = sliderRef.current.clientWidth
      const index = Math.round(scrollPosition / width)
      setCurrentImageIndex(index)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!sliderRef.current) return
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        sliderRef.current.scrollLeft -= sliderRef.current.clientWidth
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        sliderRef.current.scrollLeft += sliderRef.current.clientWidth
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAdd = useCallback(() => {
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setFeedbackMessage('Por favor, selecione uma cor.')
      setTimeout(() => setFeedbackMessage(null), 3000)
      return
    }
    
    if (!selectedSize) {
      setFeedbackMessage('Por favor, selecione um tamanho.')
      setTimeout(() => setFeedbackMessage(null), 3000)
      return
    }

    addToCart(product, selectedSize, selectedColor ? selectedColor.name : null)
    setIsCartOpen(true)
  }, [product, selectedSize, selectedColor, addToCart, setIsCartOpen])

  if (loading) return <Loading />
  
  if (error || !product) return (
    <div className="h-screen flex flex-col items-center justify-center text-white bg-black gap-4 px-6">
      <p className="text-lg text-white/60">{error || 'Produto não encontrado'}</p>
      <button 
        onClick={handleBack} 
        className="px-6 py-3 bg-white text-black font-bold hover:bg-white/90 transition"
      >
        Voltar para a loja
      </button>
    </div>
  )

  return (
    <>
      <SEO
        title={product.name}
        description={product.description}
        image={optimizeImage(images[0], 800)}
        url={`/product/${product.id}`}
      >
        {mainImagePreload && (
          <link
            rel="preload"
            as="image"
            href={mainImagePreload}
            fetchPriority="high"
          />
        )}

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": images.map(img => optimizeImage(img, 1000)),
            "description": product.description || '',
            "brand": {
              "@type": "Brand",
              "name": "Street Stars"
            },
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "BRL",
              "availability": product.isActive
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              "url": `https://streetstars.vercel.app/product/${product.id}`,
              "seller": {
                "@type": "Organization",
                "name": "Street Stars"
              }
            }
          })}
        </script>
      </SEO>

      <div className="bg-black min-h-screen text-white pt-24 pb-10 relative">

        {feedbackMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-6 py-3 text-sm font-bold shadow-lg animate-fade-in rounded-sm">
            {feedbackMessage}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 mb-4">
          <button 
            onClick={handleBack}
            aria-label='Voltar para a página anterior'
            className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Voltar
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">

          <div className="relative group w-full min-w-0 lg:sticky lg:top-24"> 
            <div 
              ref={sliderRef}
              onScroll={handleScroll}
              tabIndex={0}
              role="region"
              aria-label="Galeria de imagens do produto"
              className="flex w-full overflow-x-auto snap-x snap-mandatory snap-always scroll-smooth scrollbar-hide aspect-[4/5] lg:aspect-auto lg:h-[85vh] bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {images.map((img, i) => (
                <div 
                  key={i} 
                  className="snap-start relative flex items-center justify-center bg-[#050505] overflow-hidden"
                  style={{ flex: '0 0 100%' }}
                >
                  <img 
                    src={optimizeImage(img, 1000)}
                    srcSet={generateSrcSet(img)}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    alt={`${product.name} - visualização ${i + 1}`}
                    width={1000}
                    height={1250}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10 pointer-events-none">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      sliderRef.current?.scrollTo({
                        left: i * sliderRef.current.clientWidth,
                        behavior: 'smooth'
                      })
                    }}
                    aria-label={`Ir para imagem ${i + 1}`}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm pointer-events-auto
                      ${currentImageIndex === i ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}

            {images.length > 1 && (
              <div className="hidden lg:group-hover:flex absolute inset-0 items-center justify-between px-4 pointer-events-none">
                <button 
                  className="pointer-events-auto p-3 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full transition"
                  aria-label='Imagem anterior'
                  onClick={() => {
                    sliderRef.current && (sliderRef.current.scrollLeft -= sliderRef.current.clientWidth)
                  }}
                >
                  ←
                </button>
                <button 
                  className="pointer-events-auto p-3 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full transition"
                  aria-label='Próxima imagem'
                  onClick={() => {
                    sliderRef.current && (sliderRef.current.scrollLeft += sliderRef.current.clientWidth)
                  }}
                >
                  →
                </button>
              </div>
            )}
          </div>

          <div className="h-full flex flex-col justify-start py-4 lg:py-0 min-w-0">
            <div className="flex flex-col gap-6">

              <nav className="text-[10px] uppercase tracking-widest text-white/40" aria-label="Breadcrumb">
                <Link to="/" className="hover:text-white">Home</Link>
                {' / '}
                <span>{product.category}</span>
                {' / '}
                <span className="text-white/60">{product.name}</span>
              </nav>

              <div>
                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2">
                  {product.name}
                </h1>
                <p className="text-2xl font-bold text-white">{formatCurrency(product.price || 0)}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                  Em até 6x sem juros
                </p>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3 text-white/90">Sobre</h2>
                <p className="text-sm text-white/70 leading-relaxed font-light whitespace-pre-line">
                  {product.description || "Descrição indisponível."}
                </p>
              </div>

              {product.details && product.details.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-white/90">Detalhes</h3>
                  <ul className="space-y-2">
                    {product.details.map((detail, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="text-white/40">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-white/10 pt-6 space-y-6">

                {product.colors && product.colors.length > 0 && (
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
                        Cor: <span className="text-white/60 font-normal">{selectedColor ? selectedColor.name : 'Selecione'}</span>
                      </label>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {product.colors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color)}
                          aria-label={`Selecionar cor ${color.name}`}
                          aria-pressed={selectedColor?.name === color.name}
                          className={`w-10 h-10 rounded-full border-2 transition-all relative
                            ${selectedColor?.name === color.name 
                              ? 'border-white scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' 
                              : 'border-white/20 hover:border-white hover:scale-105'}
                          `}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold">Tamanho</label>
                    
                    {product.measurements && (
                      <button 
                        onClick={() => setShowSizeGuide(true)}
                        className="text-[10px] underline text-white/40 hover:text-white transition-colors"
                      >
                        Guia de Medidas
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {product.sizes?.map(size => (
                      <button
                        key={size}
                        aria-label={`Selecionar tamanho ${size}`}
                        aria-pressed={selectedSize === size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-14 h-14 border-2 flex items-center justify-center text-sm font-bold transition-all
                          ${selectedSize === size 
                            ? 'bg-white text-black border-white scale-110' 
                            : 'bg-transparent text-white border-white/20 hover:border-white hover:scale-105'}
                        `}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="text-[10px] mb-4 text-white/50 tracking-[0.3em] text-center">
                  Pronto pra brilhar?
                </p>

                <button
                  onClick={handleAdd}
                  disabled={!selectedSize || (product.colors && product.colors.length > 0 && !selectedColor)}
                  className={`w-full py-5 font-bold text-sm uppercase tracking-[0.2em] transition-all
                    ${selectedSize && (!product.colors || product.colors.length === 0 || selectedColor)
                      ? 'bg-white text-black hover:bg-zinc-200 active:scale-95' 
                      : 'bg-zinc-800 text-white/20 cursor-not-allowed'}
                  `}
                >
                  {(product.colors && product.colors.length > 0 && !selectedColor) 
                    ? 'Selecione uma cor' 
                    : (!selectedSize 
                      ? 'Selecione um tamanho' 
                      : 'Adicionar à Sacola')}
                </button>
                
                <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-white/40 uppercase tracking-widest">
                  <span>🔒 Compra Segura</span>
                  <span>•</span>
                  <span>Entrega Nacional 🇧🇷</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {relatedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mt-24 border-t border-white/10 pt-16">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-8">
              Complete o <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>Look</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(related => (
                <Link 
                  key={related.id} 
                  to={`/product/${related.id}`} 
                  className="group"
                  aria-label={`Ver ${related.name}`}
                >
                  <div className="aspect-[4/5] bg-zinc-900 overflow-hidden mb-3 rounded-sm">
                    <img 
                      src={optimizeImage(related.img, 500)}
                      srcSet={generateSrcSet(related.img)}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      alt={related.name}
                      width={500}
                      height={625}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">{related.name}</p>
                  <p className="text-sm font-bold">{formatCurrency(related.price || 0)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>

      {showSizeGuide && product.measurements && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
        >
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowSizeGuide(false)}
            aria-hidden="true"
          />
          
          <div className="relative bg-[#0F0F0F] border border-white/10 p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowSizeGuide(false)}
              aria-label="Fechar guia de medidas"
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
            
            <h3 id="size-guide-title" className="text-2xl font-black uppercase italic mb-2">
              Guia de Medidas
            </h3>
            <p className="text-xs text-white/50 mb-6 uppercase tracking-widest">{product.name}</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white/80 text-left border-collapse min-w-[300px]">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase tracking-wider">
                    {product.measurements?.columns?.map((col, index) => (
                      <th key={index} className="py-3 px-3 font-semibold text-left">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.measurements?.rows?.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{row.size}</td>
                      {row.values?.map((val, j) => (
                        <td key={j} className="py-3 px-3 font-mono text-white/70">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2 text-[10px] text-white/30 uppercase tracking-widest border-t border-white/5 pt-4">
              <p>* Medidas em centímetros</p>
              <p>* Tolerância de +/- 2cm</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}