import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'

export default function CartDrawer() {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    cartTotal 
  } = useCart()

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isCartOpen])

  const handleCheckout = () => {
    const phoneNumber = "5511999999999"
    
    let message = `*NOVO PEDIDO - STREET STARS* ⭐\n\n`
    cartItems.forEach(item => {
      message += `▪️ ${item.quantity}x ${item.name} | Tam: ${item.size}\n`
    })
    message += `\n*Total: R$ ${cartTotal.toFixed(2)}*\n`
    message += `\nGostaria de finalizar a compra e combinar o pagamento.`

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

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
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-[#050505] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-display uppercase tracking-wider">Sua Sacola ({cartItems.length})</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                alt="Fechar carrinho"
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                  <span className="text-4xl">🛒</span>
                  <p className="uppercase tracking-widest text-xs">Sua sacola está vazia</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    alt="Voltar a comprar"
                    className="text-white border-b border-white pb-1 text-xs uppercase"
                  >
                    Voltar a comprar
                  </button>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <motion.div 
                    layout
                    key={`${item.id}-${item.size}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 bg-white/5 p-3 rounded-md border border-white/5"
                  >
                    <div className="w-20 aspect-[4/5] bg-zinc-900 rounded-sm overflow-hidden flex-shrink-0">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs uppercase font-bold tracking-widest text-white/90 pr-2">{item.name}</h3>
                          <p className="text-xs font-mono text-white/60">R${item.price.toFixed(2)}</p>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 uppercase">Tamanho: <span className="text-white">{item.size}</span></p>
                      </div>

                      <div className="flex justify-between items-end mt-2">
                        <div className="flex items-center gap-3 bg-black/40 px-2 py-1 rounded border border-white/10">
                          <button onClick={() => removeFromCart(item.id, item.size)} alt="Remover item" className="text-white/50 hover:text-white">-</button>
                          <span className="text-xs font-mono">{item.quantity}</span>
                          <span className="text-white/20 text-[10px]">UN</span>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id, item.size)}
                          alt="Remover item"
                          className="text-[10px] underline text-white/40 hover:text-red-400 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-black border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm uppercase tracking-widest">
                  <span className="text-white/60">Subtotal</span>
                  <span className="font-bold text-lg">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-center text-white/40">Frete calculado no próximo passo</p>
                
                <button
                  onClick={handleCheckout}
                  alt="Finalizar pedido via WhatsApp"
                  className="w-full py-4 bg-white text-black font-bold uppercase tracking-[0.2em] hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Finalizar Pedido 
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}