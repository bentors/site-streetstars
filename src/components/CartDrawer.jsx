import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, // Importando a nova função
    cartTotal 
  } = useCart()

  // Trava o scroll do fundo ao abrir
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isCartOpen])

  // Lógica do WhatsApp (Mantida e melhorada)
  const handleCheckout = () => {
    const phoneNumber = "5511999999999" // Coloque seu número real aqui
    
    let message = `*NOVO PEDIDO - STREET STARS* ⭐\n\n`
    cartItems.forEach(item => {
      message += `▪️ ${item.quantity}x ${item.name} | Tam: ${item.size}\n`
    })
    message += `\n*Total: R$ ${cartTotal.toFixed(2)}*\n`
    message += `\nOlá! Gostaria de finalizar a compra e combinar o pagamento.`

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay Escuro com Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Gaveta Lateral */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-[#050505] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            {/* Header do Carrinho */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#050505]">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">
                Sua Sacola <span className="not-italic font-sans text-sm text-white/50 ml-1">({cartItems.length})</span>
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-white/50 hover:text-white hover:rotate-90 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Lista de Produtos */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-black scrollbar-thumb-zinc-800">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                  <span className="text-4xl opacity-50">🛒</span>
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
                  <motion.div 
                    layout
                    key={`${item.id}-${item.size}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 group"
                  >
                    {/* Imagem */}
                    <Link 
                      to={`/product/${item.id}`} 
                      onClick={() => setIsCartOpen(false)}
                      className="w-20 aspect-[4/5] bg-zinc-900 border border-white/5 overflow-hidden flex-shrink-0"
                    >
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </Link>

                    {/* Infos */}
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
                            onClick={() => removeFromCart(item.id, item.size)}
                            className="text-white/30 hover:text-red-500 transition-colors"
                            title="Remover item"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 uppercase">
                          Tamanho: <span className="text-white font-bold">{item.size}</span>
                        </p>
                      </div>

                      {/* Controles de Preço e Quantidade */}
                      <div className="flex justify-between items-end mt-3">
                        
                        {/* Seletor de Quantidade */}
                        <div className="flex items-center border border-white/10 rounded-sm">
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono min-w-[1.5rem] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer do Carrinho */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-[#0A0A0A] border-t border-white/10 space-y-4 z-10">
                <div className="flex justify-between items-center text-sm uppercase tracking-widest">
                  <span className="text-white/60">Subtotal</span>
                  <span className="font-bold text-lg">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-center text-white/40">Frete calculado no checkout.</p>
                
                <button
                  onClick={handleCheckout}
                  className="group relative w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center justify-center gap-2">
                    Finalizar compra 
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-green-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"/>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}