import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WHATSAPP_NUMBER = "5511999999999"
const WHATSAPP_MESSAGE = "Olá! Vim pelo site da Street Stars e gostaria de mais informações."

export default function FloatingAction() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const containerRef = useRef(null)

  const toggle = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500)
    }
    
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, close])

  useEffect(() => {
    if (!open) return

    function handleEscape(e) {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, close])

  const handleScrollToShop = useCallback(() => {
    const shopSection = document.getElementById('shop')
    if (shopSection) {
      const offset = 80 
      const elementPosition = shopSection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      close()
    }
  }, [close])

  const handleWhatsApp = useCallback(() => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    close()
  }, [close])

  if (!visible) return null

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div 
        ref={containerRef}
        className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4"
      >
        <AnimatePresence>
          {open && (
            <div className="flex flex-col items-end gap-3 mb-2">

              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={handleWhatsApp}
                aria-label="Abrir WhatsApp"
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#25D366] text-white text-sm font-bold shadow-xl hover:brightness-110 transition-all origin-bottom-right"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-2.846-.828-.307-.126-1.8-1.547-1.92-1.706-.12-.159-.441-.572-.441-1.096 0-.525.268-.786.381-.897.113-.111.3-.14.48-.14.156 0 .313.008.452.032.122.021.285.068.431.42.175.421.571 1.415.62 1.516.049.102.082.221.016.353-.066.132-.099.213-.197.332-.098.118-.206.264-.294.355-.099.102-.202.213-.087.417.115.204.509.842 1.101 1.37.594.529 1.104.708 1.263.788.158.079.252.067.346-.039.094-.106.404-.471.513-.632.108-.161.226-.134.379-.078.154.056.969.457 1.135.54.166.083.276.124.316.195.04.07.04.405-.104.81z"/>
                </svg>
                WhatsApp
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                onClick={handleScrollToShop}
                aria-label="Ir para loja"
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-white text-black text-sm font-bold shadow-xl hover:bg-zinc-200 transition-all origin-bottom-right"
              >
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Ir para Loja
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={open ? "Fechar menu flutuante" : "Abrir menu flutuante"}
          aria-expanded={open}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-300 z-50
            ${open ? 'bg-black text-white' : 'bg-white text-black'}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  )
}