import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'
import { optimizeImage } from '../../utils/image'
import { useAuth } from '../../context/AuthContext'

const WHATSAPP_NUMBER = "5511999999999"

export default function CartDrawer() {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity,
    cartTotal 
  } = useCart()

  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (isCartOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isCartOpen])

  useEffect(() => {
    if (!isCartOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isCartOpen, setIsCartOpen])

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0 || isProcessing) return

    setIsCartOpen(false)

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout/endereco' } } })
      return
    }

    navigate('/checkout/endereco')
  }, [cartItems, user, isProcessing, setIsCartOpen, navigate])

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho de compras"
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-[#050505] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#050505]">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">
                Sua Sacola 
                <span className="not-italic font-sans text-sm text-white/50 ml-2">
                  ({cartItems.length})
                </span>
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                aria-label="Fechar carrinho"
                className="p-2 text-white/50 hover:text-white hover:rotate-90 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-black scrollbar-thumb-zinc-800">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                  <span className="text-4xl opacity-50" aria-hidden="true">🛒</span>
                  <p className="uppercase tracking-widest text-xs">Sua sacola está vazia</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-white border-b border-white pb-1 text-xs uppercase hover:text-white/80 transition-colors"
                  >
                    Voltar a comprar
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.article 
                    layout
                    key={`${item.id}-${item.size}-${item.color || 'default'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex gap-4 group"
                  >
                    <Link 
                      to={`/product/${item.id}`} 
                      onClick={() => setIsCartOpen(false)}
                      className="w-20 aspect-[4/5] bg-zinc-900 border border-white/5 overflow-hidden flex-shrink-0"
                      aria-label={`Ver detalhes de ${item.name}`}
                    >
                      <img 
                        src={optimizeImage(item.img, 200)}
                        alt={item.name}
                        width={200}
                        height={250}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </Link>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <Link 
                            to={`/product/${item.id}`} 
                            onClick={() => setIsCartOpen(false)}
                            className="text-xs uppercase font-bold tracking-widest text-white/90 hover:text-white line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <button 
                            onClick={() => removeFromCart(item.id, item.size, item.color)}
                            aria-label={`Remover ${item.name} do carrinho`}
                            className="text-white/30 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] text-white/50 uppercase">
                            Tamanho: <span className="text-white font-bold">{item.size}</span>
                          </p>
                          {item.color && (
                            <p className="text-[10px] text-white/50 uppercase">
                              Cor: <span className="text-white font-bold">{item.color}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-3">
                        <div className="flex items-center border border-white/10 rounded-sm" role="group" aria-label="Quantidade">
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                            aria-label="Diminuir quantidade"
                            className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono min-w-[1.5rem] text-center" aria-label={`Quantidade: ${item.quantity}`}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                            aria-label="Aumentar quantidade"
                            className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-bold" aria-label={`Subtotal: ${formatCurrency(item.price * item.quantity)}`}>
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-[#0A0A0A] border-t border-white/10 space-y-4 z-10">
                <div className="flex justify-between items-center text-sm uppercase tracking-widest">
                  <span className="text-white/60">Subtotal</span>
                  <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
                </div>
                <p className="text-[10px] text-center text-white/40">
                  Frete e impostos calculados no checkout.
                </p>
                
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className={`group relative w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] overflow-hidden transition-opacity ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center justify-center gap-2">
                    {isProcessing ? 'Processando...' : 'Finalizar compra'}
                    {!isProcessing && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"/>
                </button>

                <p className="text-[9px] text-center text-white/30 uppercase tracking-wider">
                  Checkout seguro via WhatsApp
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}