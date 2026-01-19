import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import { PRODUCTS } from '../data/products.js'

export default function ProductPage() {
  const { id } = useParams()
  const { addToCart, setIsCartOpen } = useCart()
  const [selectedSize, setSelectedSize] = useState(null)
  
  const product = PRODUCTS.find(p => p.id === parseInt(id))

  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!product) return <div className="h-screen flex items-center justify-center text-white">Produto não encontrado</div>

  const handleAdd = () => {
    if(!selectedSize) return alert('Selecione um tamanho')
    addToCart(product, selectedSize)
    setIsCartOpen(true)
  }

  return (
    <div className="bg-black min-h-screen text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 mb-8">
            <button 
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Voltar
            </button>
        </div>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-zinc-900 w-full overflow-hidden">
             <img src={product.img} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-zinc-900 overflow-hidden">
                <img src={product.img} className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" />
            </div>
            <div className="aspect-square bg-zinc-900 overflow-hidden">
                <img src={product.img} className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-32 h-fit">
          <div className="flex flex-col gap-6">

            <div className="text-[10px] uppercase tracking-widest text-white/40">
              <Link to="/" className="hover:text-white">Home</Link> / {product.category} / {product.name}
            </div>

            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-2">
                {product.name}
              </h1>
              <p className="text-xl text-white/80">R$ {product.price.toFixed(2)}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                Em até 6x sem juros
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-sm text-white/70 leading-relaxed font-light">
                Desenvolvida com modelagem boxy exclusiva Street Stars. Malha heavyweight 260g (alta gramatura) com toque peletizado. Estampa em silk-screen de alta densidade. A peça ideal para compor o kit noturno.
              </p>
            </div>

            <div className="py-6">
              <div className="flex justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Tamanho</span>
                <button className="text-[10px] underline text-white/40 hover:text-white">Guia de Medidas</button>
              </div>
              <div className="flex gap-3">
                {product.sizes.map(size => (
                  <button
                    key={size}
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

            <button
              onClick={handleAdd}
              disabled={!selectedSize}
              className={`w-full py-5 font-bold uppercase tracking-[0.2em] transition-all
                ${selectedSize 
                  ? 'bg-white text-black hover:bg-zinc-200' 
                  : 'bg-zinc-800 text-white/20 cursor-not-allowed'}
              `}
            >
              {selectedSize ? 'Adicionar à Sacola' : 'Selecione um tamanho'}
            </button>
            
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-white/40 uppercase tracking-widest">
               <span>🔒 Compra Segura</span>
               <span>•</span>
               <span>Envio em 24h</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}