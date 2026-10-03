import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '../../utils/format'
import { optimizeImage } from '../../utils/image'
import { collection, getDocs, query, where, limit } from 'firebase/firestore/lite'
import { db } from '../../services/firebase'

let productsCache = null

export default function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [productsList, setProductsList] = useState(productsCache || [])
  const [loading, setLoading] = useState(false)
  
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && !productsCache) {
      setLoading(true)
      
      async function loadSearchData() {
        try {
          const productsRef = collection(db, "products")
          const q = query(
            productsRef,
            where('isActive', '==', true),
            limit(100)
          )
          const snapshot = await getDocs(q)
          
          const list = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            list.push({
              id: doc.id,
              name: data.name,
              category: data.category,
              img: data.img,
              price: data.price
            })
          })
          
          setProductsList(list)
          productsCache = list
        } catch (err) {
          console.error("Erro ao carregar produtos para busca:", err)
        } finally {
          setLoading(false)
        }
      }

      loadSearchData()
    }
  }, [isOpen])

  const results = useMemo(() => {
    if (queryText.length === 0) return []
    
    const term = queryText.toLowerCase().trim()
    
    return productsList
      .filter(p => {
        const matchName = p.name?.toLowerCase().includes(term)
        const matchCategory = p.category?.toLowerCase().includes(term)
        return matchName || matchCategory
      })
      .slice(0, 10)
  }, [queryText, productsList])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setQueryText('')
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleEscape(e) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQueryText('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setQueryText('')
    }
  }

  const handleResultClick = () => {
    setIsOpen(false)
    setQueryText('')
  }

  return (
    <div ref={containerRef} className="relative z-40"> 

      <button 
        onClick={handleOpen}
        aria-label={isOpen ? "Fechar busca" : "Abrir busca"}
        aria-expanded={isOpen}
        className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
            transition={{ duration: 0.2 }}
            role="search"
            className="absolute right-0 top-full mt-2 w-[280px] md:w-[360px] bg-zinc-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden origin-top-right"
          >
            <div className="p-4 border-b border-white/10">
              <label htmlFor="search-input" className="sr-only">Buscar produtos</label>
              <input
                ref={inputRef}
                id="search-input"
                type="search"
                placeholder="BUSCAR PEÇA..."
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="w-full bg-transparent text-white placeholder:text-white/30 text-sm uppercase tracking-widest outline-none"
                autoComplete="off"
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
              
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : queryText.length === 0 ? (
                <div className="p-6 text-center text-white/40 text-xs uppercase tracking-wider">
                  Digite para buscar
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center text-white/40 text-xs uppercase tracking-wider">
                  Nenhuma peça encontrada
                  <p className="text-[10px] mt-2 text-white/20 normal-case">
                    Tente buscar por nome ou categoria
                  </p>
                </div>
              ) : (
                <div className="flex flex-col" role="list">
                  {results.map(product => (
                    <Link 
                      key={product.id} 
                      to={`/product/${product.id}`}
                      onClick={handleResultClick}
                      role="listitem"
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                    >
                      <div className="w-12 h-14 bg-zinc-800 overflow-hidden rounded-sm flex-shrink-0">
                        <img 
                          src={optimizeImage(product.img, 100)} 
                          alt=""
                          width={100}
                          height={117}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white uppercase mb-1 line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-white/90">
                            {formatCurrency(product.price || 0)}
                          </span>
                          {product.category && (
                            <span className="text-[9px] text-white/40 uppercase border border-white/10 px-1 rounded-[2px]">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {queryText.length > 0 && results.length > 0 && (
              <div className="px-4 py-2 bg-zinc-950 border-t border-white/5 text-center">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">
                  {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}