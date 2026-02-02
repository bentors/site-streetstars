import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { formatCurrency } from '../../utils/format'
import { optimizeImage, generateSrcSet } from '../../utils/image'
import { CATEGORIES } from '../../data/constants'
import Loading from '../Loading'

let cachedProducts = null

export default function Shop() {
  const [filter, setFilter] = useState("TODOS")
  const [products, setProducts] = useState(cachedProducts || [])
  const [loading, setLoading] = useState(!cachedProducts)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cachedProducts) {
      setLoading(false)
      return
    }

    async function loadProducts() {
      try {
        const productsRef = collection(db, "products")
        const q = query(productsRef, orderBy("created_at", "asc"))
        
        const querySnapshot = await getDocs(q)
        const list = []
        
        querySnapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data()
          })
        })

        setProducts(list)
        cachedProducts = list
      } catch (error) {
        console.error("Erro ao buscar produtos:", error)
        setError("Não foi possível carregar os produtos. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    return filter === "TODOS" 
      ? products 
      : products.filter(p => p.category === filter)
  }, [filter, products])

  if (loading) return <Loading />

  if (error) {
    return (
      <section className="py-24 bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="text-white/60 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-black font-bold hover:bg-white/90 transition"
          >
            Recarregar
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="shop" className="py-24 sm:py-32 bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-16 gap-10 border-b border-white/10 pb-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-[0.9]">
              Seja uma <br/>
              <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>Estrela das Ruas</span>
            </h2>
            <p className="mt-4 text-sm text-white/50 tracking-widest uppercase">
              com Street Stars ®
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Filtrar produtos por categoria">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                aria-label={`Filtrar por ${cat}`}
                aria-pressed={filter === cat}
                onClick={() => setFilter(cat)}
                className={`text-[11px] uppercase tracking-[0.2em] transition-all relative py-1
                  ${filter === cat ? 'text-white font-bold' : 'text-white/50 hover:text-white'}
                `}
              >
                {cat}
                {filter === cat && (
                  <motion.div 
                    layoutId="activeFilter"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-white"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {products.length === 0 && (
           <div className="text-center text-white/40 py-20">
              <p className="text-lg mb-2">Nenhum produto cadastrado ainda.</p>
              <p className="text-sm">Em breve teremos novidades por aqui.</p>
           </div>
        )}

        {products.length > 0 && filteredProducts.length === 0 && (
          <div className="text-center text-white/40 py-20">
            <p className="text-lg mb-2">Nenhum produto encontrado em "{filter}"</p>
            <button 
              onClick={() => setFilter("TODOS")}
              className="text-sm text-white/60 hover:text-white underline"
            >
              Ver todos os produtos
            </button>
          </div>
        )}

        <motion.div 
          layout 
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8"
        >
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map((product) => (
              <motion.article
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group select-none"
              >
                <Link 
                  to={`/product/${product.id}`} 
                  className="block"
                  aria-label={`Ver detalhes de ${product.name}`}
                >

                  <div className="relative aspect-[4/5] bg-[#0a0a0a] overflow-hidden mb-5 rounded-sm">
                    <img 
                      src={optimizeImage(product.img, 500)}
                      srcSet={generateSrcSet(product.img)}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      alt={product.name}
                      width={500}
                      height={625}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="block w-full text-center bg-white text-black text-[10px] font-bold uppercase tracking-widest py-2 shadow-lg">
                        Ver Peça
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-xs uppercase tracking-[0.15em] font-bold text-white group-hover:text-white/80 transition-colors truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white/90">
                        {formatCurrency(product.price || 0)}
                      </p>
                      <span className="text-[11px] text-white/50 uppercase tracking-wider">
                        Em até 6x sem juros
                      </span>
                    </div>
                  </div>

                </Link>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  )
}