import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { doc, getDoc, getDocs, collection, query, where, limit } from 'firebase/firestore'
import { db } from '../services/firebase.js'
import Loading from '../components/Loading'
import { formatCurrency } from '../utils/format'
import { optimizeImage } from '../utils/image'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, setIsCartOpen } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState([])

  const handleBack = () => {
    navigate('/', { state: { scrollTo: 'shop' } })
  }

  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const sliderRef = useRef(null)

  useEffect(() => {
    async function loadProduct() {
      try {
        const docRef = doc(db, "products", id)
        const snapshot = await getDoc(docRef)

        if (snapshot.exists()) {
          const data = snapshot.data()
          setProduct({ id: snapshot.id, ...data })

          setSelectedSize(null)
          setSelectedColor(null)
          window.scrollTo(0, 0)

          loadRelated(data.category, snapshot.id)

        } else {
          setProduct(null)
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  async function loadRelated(category, currentId) {
     try {
        const productsRef = collection(db, "products")
        const q = query(productsRef, where("category", "==", category), limit(5))
        const snapshot = await getDocs(q)
        
        const list = []
        snapshot.forEach(doc => {
            if(doc.id !== currentId) {
                list.push({ id: doc.id, ...doc.data() })
            }
        })
        setRelatedProducts(list.slice(0, 4))
     } catch(err) {
         console.log("Erro ao carregar relacionados", err)
     }
  }

  const images = product?.gallery || (product ? [product.img] : [])

  useEffect(() => {
    if (selectedColor && selectedColor.img && sliderRef.current) {
      const colorImgIndex = images.findIndex(img => img === selectedColor.img)
      if (colorImgIndex !== -1) {
        sliderRef.current.scrollTo({
          left: colorImgIndex * sliderRef.current.clientWidth,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedColor, images])

  const handleScroll = () => {
    if (sliderRef.current) {
      const scrollPosition = sliderRef.current.scrollLeft
      const width = sliderRef.current.clientWidth
      const index = Math.round(scrollPosition / width)
      setCurrentImageIndex(index)
    }
  }

  const handleAdd = () => {
    if (product.colors && product.colors.length > 0 && !selectedColor) {
        return alert('Por favor, selecione uma cor.')
    }
    if (!selectedSize) return alert('Selecione um tamanho')

    addToCart(product, selectedSize, selectedColor ? selectedColor.name : null)
    setIsCartOpen(true)
  }

  if (loading) return <Loading />
  
  if (!product) return (
      <div className="h-screen flex flex-col items-center justify-center text-white bg-black gap-4">
          <p>Produto não encontrado.</p>
          <button onClick={handleBack} className="underline">Voltar para a loja</button>
      </div>
  )

  return (
    <div className="bg-black min-h-screen text-white pt-24 pb-10 relative">
      
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

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-center">

        <div className="relative group w-full min-w-0"> 
          <div 
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex w-full overflow-x-auto snap-x snap-mandatory snap-always scroll-smooth scrollbar-hide aspect-[4/5] lg:aspect-auto lg:h-[98vh] bg-zinc-900"
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
                      alt={`${product.name} - view ${i + 1}`}
                      className="w-full h-full object-cover" 
                    />
                </div>
            ))}
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if(sliderRef.current) {
                    sliderRef.current.scrollTo({
                      left: i * sliderRef.current.clientWidth,
                      behavior: 'smooth'
                    })
                  }
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm
                  ${currentImageIndex === i ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>

          <div className="hidden lg:group-hover:flex absolute inset-0 items-center justify-between px-4 pointer-events-none">
             <button 
                className="pointer-events-auto p-2 bg-black/20 backdrop-blur-sm hover:bg-black/50 text-white rounded-full transition"
                aria-label='Voltar para a imagem anterior'
                onClick={() => {
                   if(sliderRef.current) sliderRef.current.scrollLeft -= sliderRef.current.clientWidth
                }}
             >
               ←
             </button>
             <button 
                className="pointer-events-auto p-2 bg-black/20 backdrop-blur-sm hover:bg-black/50 text-white rounded-full transition"
                aria-label='Avançar para a próxima imagem'
                onClick={() => {
                   if(sliderRef.current) sliderRef.current.scrollLeft += sliderRef.current.clientWidth
                }}
             >
               →
             </button>
          </div>
        </div>

        <div className="h-full flex flex-col justify-center py-4 lg:py-0 min-w-0">
          <div className="flex flex-col gap-6">

            <div className="text-[10px] uppercase tracking-widest text-white/40">
              <Link to="/" className="hover:text-white">Home</Link> / {product.category} / {product.name}
            </div>

            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2">
                {product.name}
              </h1>
              <p className="text-xl text-white/80">{formatCurrency(product.price || 0)}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                Em até 6x sem juros
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2 text-white/90">Sobre</h3>
              <p className="text-sm text-white/70 leading-relaxed font-light whitespace-pre-line">
                {product.description || "Descrição indisponível."}
              </p>
            </div>

            {product.details && (
                <div className="py-2">
                    <ul className="list-disc list-inside space-y-1">
                        {product.details.map((detail, i) => (
                            <li key={i} className="text-xs text-white/60">{detail}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="py-6">

              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                   <div className="flex justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                        Cor: <span className="text-white/60 font-normal">{selectedColor ? selectedColor.name : 'Selecione'}</span>
                      </span>
                   </div>
                   <div className="flex gap-3">
                      {product.colors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-full border border-white/20 hover:scale-110 transition-all relative
                            ${selectedColor?.name === color.name ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}
                          `}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                   </div>
                </div>
              )}

              <div className="flex justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Tamanho</span>
                
                {product.measurements && (
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="text-[10px] underline text-white/40 hover:text-white transition-colors"
                  >
                    Guia de Medidas
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                {product.sizes?.map(size => (
                  <button
                    key={size}
                    aria-label={`Selecionar tamanho ${size}`}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 border flex items-center justify-center text-xs font-bold transition-all
                      ${selectedSize === size 
                        ? 'bg-white text-black border-white scale-110' 
                        : 'bg-transparent text-white border-white/20 hover:border-white'}
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>

            </div>

              <p className="text-[10px] mt-10 text-white/50 tracking-[0.3em]">
                Pronto pra brilhar?
              </p>

            <button
              onClick={handleAdd}
              disabled={!selectedSize || (product.colors && product.colors.length > 0 && !selectedColor)}
              className={`w-full py-5 font-bold uppercase tracking-[0.2em] transition-all
                ${selectedSize && (!product.colors || product.colors.length === 0 || selectedColor)
                  ? 'bg-white text-black hover:bg-zinc-200' 
                  : 'bg-zinc-800 text-white/20 cursor-not-allowed'}
              `}
            >
              {(product.colors && !selectedColor) ? 'Selecione uma cor' : (!selectedSize ? 'Selecione um tamanho' : 'Adicionar à Sacola')}
            </button>
            
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-white/40 uppercase tracking-widest">
               <span>🔒 Compra Segura</span>
               <span>•</span>
               <span>Entrega para todo o Brasil 🇧🇷</span>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
            <div className="max-w-7xl mx-auto px-6 mt-20 border-t border-white/10 pt-16 lg:col-span-2 w-full">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8">
                    Complete o <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>Kit</span>
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedProducts.map(related => (
                        <Link key={related.id} to={`/product/${related.id}`} className="group">
                            <div className="aspect-[4/5] bg-zinc-900 overflow-hidden mb-3">
                                <img 
                                  src={optimizeImage(related.img, 500)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                  alt={related.name} 
                                />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-white/60">{related.name}</p>
                            <p className="text-sm font-bold">{formatCurrency(related.price || 0)}</p>
                        </Link>
                    ))}
                </div>
            </div>
        )}

      </div>

      {showSizeGuide && product.measurements && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSizeGuide(false)} />
          
          <div className="relative bg-[#0F0F0F] border border-white/10 p-6 md:p-8 max-w-lg w-full shadow-2xl overflow-hidden">
            <button 
              onClick={() => setShowSizeGuide(false)} 
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-display uppercase italic mb-2">Guia de Medidas</h3>
            <p className="text-xs text-white/50 mb-6 uppercase tracking-widest">{product.name}</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white/80 text-left border-collapse min-w-[300px]">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase tracking-wider">
                    {product.measurements?.columns?.map((col, index) => (
                      <th key={index} className="py-3 px-2 font-normal">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.measurements?.rows?.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 font-bold text-white">{row.size}</td>
                      {row.values?.map((val, j) => (
                        <td key={j} className="py-3 px-2 font-mono text-white/70">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-4 text-[10px] text-white/30 uppercase tracking-widest border-t border-white/5 pt-4">
              <span>* Medidas em cm</span>
              <span>* Tolerância +/- 2cm</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}