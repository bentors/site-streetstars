import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PRODUCTS } from '../data/products'

export default function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)

  const safeProducts = Array.isArray(PRODUCTS) ? PRODUCTS : []

  const results = query.length > 0 
    ? safeProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 4)
    : []

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative z-40"> 

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center text-white hover:text-white/70 transition-colors"
        aria-label="Buscar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="absolute right-0 top-full mt-2 w-[280px] md:w-[350px] bg-zinc-900 border border-white/10 rounded-sm shadow-2xl overflow-hidden origin-top-right"
          >
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                autoFocus
                placeholder="BUSCAR PEÇA..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder:text-white/30 text-sm uppercase tracking-widest outline-none"
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {query.length > 0 && results.length === 0 ? (
                <div className="p-6 text-center text-white/40 text-xs uppercase tracking-wider">
                  Nenhuma peça encontrada.
                </div>
              ) : (
                <div className="flex flex-col">
                  {results.map(product => (
                    <Link 
                      key={product.id} 
                      to={`/product/${product.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                    >
                      <div className="w-10 h-12 bg-white/5 overflow-hidden rounded-[2px] flex-shrink-0">
                        <img 
                          src={product.img} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase mb-1">{product.name}</h4>
                        <span className="text-[10px] font-mono text-white/60">
                            R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  ))}

                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}