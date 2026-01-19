import { useState, useEffect, useRef } from 'react'
import { FaWhatsapp, FaShoppingBag, FaTimes } from 'react-icons/fa'
import { scrollToSection } from '../utils/scrollToSection'

export default function FloatingAction({ setOverlayActive }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const containerRef = useRef(null)

  function toggle() {
    setOpen(prev => {
    const next = !prev
    setOverlayActive(next)
    return next
  })
  }

  function close() {
    setOpen(false)
    setOverlayActive(false)
  }

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
        setOverlayActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

    if (!visible) return null

  return (

    <div 
        ref={containerRef}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
    >
      
      {open && (
        <>
          <a
            href="https://wa.me/5511999942500"
            target="_blank"
            aria-label="Falar no WhatsApp"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-full bg-green-500 text-black text-sm font-semibold shadow-lg hover:scale-105 transition"
          >
            <FaWhatsapp />
            Falar no WhatsApp
          </a>

          <button
            onClick={() => scrollToSection('#shop')}
            aria-label='Comprar com a Street Stars'
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-full bg-white text-black text-sm font-semibold shadow-lg hover:scale-105 transition"
          >
            <FaShoppingBag />
            Ir para a loja
          </button>
        </>
      )}

      <button
        aria-label="Abrir ações rápidas"
        onClick={toggle}
        className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 transition"
      >
        {open ? <FaTimes /> : <FaWhatsapp />}
      </button>
    </div>
  )
}
