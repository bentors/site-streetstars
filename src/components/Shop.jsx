import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebaseConnection'

import { CATEGORIES } from '../data/constants'
import Loading from '../components/Loading'

export default function Shop() {
  const [filter, setFilter] = useState("TODOS")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      } catch (error) {
        console.log("Erro ao buscar produtos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = filter === "TODOS" 
    ? products 
    : products.filter(p => p.category === filter)

  if (loading) return <Loading />

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

          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                aria-label={`Filtrar produtos por categoria ${cat}`}
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
              <p>Nenhum produto cadastrado ainda.</p>
           </div>
        )}

        <motion.div 
          layout 
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-8"
        >
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group select-none"
              >
                <Link to={`/product/${product.id}`} className="block">
                  
                  <div className="relative aspect-[4/5] bg-[#0a0a0a] overflow-hidden mb-5 rounded-sm">
                    <img 
                      src={product.img} 
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                    />
                     <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <span className="block w-full text-center bg-white text-black text-[10px] font-bold uppercase tracking-widest py-2">
                            Ver Peça
                        </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-xs uppercase tracking-[0.15em] font-bold text-white group-hover:text-white/80 transition-colors truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white/90">R$ {product.price.toFixed(2)}</p>
                      <span className="text-[11px] text-white/50 uppercase tracking-wider">
                        Em até 6x
                      </span>
                    </div>
                  </div>

                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  )
}