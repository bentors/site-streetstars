import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FloatingAction({ setOverlayActive }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const containerRef = useRef(null)

  function toggle() {
    setOpen(prev => {
      const next = !prev
      // Removi a dependência do overlay global para evitar conflitos de Z-Index
      // if (setOverlayActive) setOverlayActive(next) 
      return next
    })
  }

  function close() {
    setOpen(false)
    // if (setOverlayActive) setOverlayActive(false)
  }

  // Aparecer apenas após rolar 500px
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fechar ao clicar fora (Mantido por segurança, mas o Overlay já faz isso)
  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

  const handleScrollToShop = () => {
    const shopSection = document.getElementById('shop')
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth' })
      close()
    }
  }

  if (!visible) return null

  return (
    <>
      {/* 1. OVERLAY (MÁSCARA) 
          Z-Index 90: Fica acima de tudo no site, mas abaixo do botão (100)
      */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close} // Clicar no fundo fecha
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* 2. CONTAINER DOS BOTÕES 
          Z-Index 100: Garante que fique acima do overlay
      */}
      <div 
        ref={containerRef}
        className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none" // pointer-events-none para a caixa vazia não bloquear cliques
      >
        <AnimatePresence>
          {open && (
            <div className="flex flex-col items-end gap-3 pointer-events-auto"> {/* pointer-events-auto reativa cliques nos botões */}
              
              {/* Botão WhatsApp */}
              <motion.a
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#25D366] text-white text-sm font-bold shadow-xl hover:brightness-110 transition-all origin-bottom-right"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-2.846-.828-.307-.126-1.8-1.547-1.92-1.706-.12-.159-.441-.572-.441-1.096 0-.525.268-.786.381-.897.113-.111.3-.14.48-.14.156 0 .313.008.452.032.122.021.285.068.431.42.175.421.571 1.415.62 1.516.049.102.082.221.016.353-.066.132-.099.213-.197.332-.098.118-.206.264-.294.355-.099.102-.202.213-.087.417.115.204.509.842 1.101 1.37.594.529 1.104.708 1.263.788.158.079.252.067.346-.039.094-.106.404-.471.513-.632.108-.161.226-.134.379-.078.154.056.969.457 1.135.54.166.083.276.124.316.195.04.07.04.405-.104.81z"/></svg>
                WhatsApp
              </motion.a>

              {/* Botão Ir para Loja */}
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                onClick={handleScrollToShop}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-white text-black text-sm font-bold shadow-xl hover:bg-zinc-200 transition-all origin-bottom-right"
              >
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Ir para Loja
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        {/* Botão Principal (Toggle) */}
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-300 pointer-events-auto
            ${open ? 'bg-black text-white rotate-45' : 'bg-white text-black'}`}
        >
          {open ? (
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          )}
        </motion.button>
      </div>
    </>
  )
}