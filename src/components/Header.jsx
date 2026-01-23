import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import logo from '../assets/images/logo.png'

const LINKS = [
  { label: 'Shop', href: '#shop' },
  { label: 'Coleções', href: '#collections' },
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Quem somos', href: '#about' },
  { label: 'Contato', href: '#footer' },
]

export default function Header({ setOverlayActive }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState(null)

  const isNavigating = useRef(false)

  const headerRef = useRef(null)
  
  const { scrollY } = useScroll()
  const { setIsCartOpen, cartCount } = useCart()
  
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsOpen(false)
        if (setOverlayActive) setOverlayActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, setOverlayActive])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (!isHome) {
      setScrolled(true)
    } else {
      setScrolled(latest > 40)
    }

    if (isNavigating.current) return

    if (isHome) {
      const layoutHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      const scrollPos = latest + clientHeight

      if (layoutHeight - scrollPos < 100) {
         setActiveSection('#footer')
      }
    }
  })

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      setActiveSection(null)
    } else {
      setScrolled(window.scrollY > 40)
    }
  }, [isHome, location])

  useEffect(() => {
    if (!isHome) return

    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -50% 0px',
      threshold: 0
    }

    const observer = new IntersectionObserver((entries) => {
      if (isNavigating.current) return
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const isBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100
          if (!isBottom || entry.target.id === 'footer') {
            setActiveSection(`#${entry.target.id}`)
          }
        }
      })
    }, observerOptions)

    const timer = setTimeout(() => {
      const sections = document.querySelectorAll('section[id], footer[id]')
      sections.forEach(section => observer.observe(section))
    }, 500)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [isHome])

  const handleNavClick = (href) => {
    setActiveSection(href)
    setIsOpen(false)
    if (setOverlayActive) setOverlayActive(false)
    isNavigating.current = true

  const scrollToTarget = () => {
      const element = document.querySelector(href)
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }

  if (isHome) {
      setTimeout(() => {
        scrollToTarget()
        setTimeout(() => { isNavigating.current = false }, 1000)
      }, 100)
    } else {
      navigate('/')
      setTimeout(() => {
        scrollToTarget()
        setTimeout(() => { isNavigating.current = false }, 1000)
      }, 300)
    }
  }

  return (
    <>
      <motion.header 
        ref={headerRef}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500
        ${scrolled || isOpen
          ? 'bg-black shadow-xl border-b border-white/10' 
          : 'bg-transparent py-5'}`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <button onClick={() => handleNavClick('#top')}>
            <img
              src={logo}
              alt="Street Stars"
              className="h-8 md:h-12 w-auto object-contain hover:opacity-80 transition"
            />
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {LINKS.map(link => (
              <button
                key={link.href}
                aria-label={`Navegar para ${link.label}`}
                onClick={() => handleNavClick(link.href)}
                className={`relative text-xs uppercase tracking-widest transition-colors
                  ${activeSection === link.href ? 'text-white' : 'text-white/60 hover:text-white'}`}
              >
                {link.label}

                {activeSection === link.href && (
                  <motion.span
                    layoutId="star-underline"
                    className="absolute -bottom-2 left-0 right-0 flex justify-center text-[10px]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    -★-
                  </motion.span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsCartOpen(true)} 
              aria-label="Abrir carrinho de compras"
              className="relative p-1 text-white/80 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={() => { const newState = !isOpen; setIsOpen(newState); 
                // if(setOverlayActive) setOverlayActive(newState)
                ; }}
              aria-label="Menu"
              className="md:hidden text-white/80"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-black/95 border-t border-white/10 overflow-hidden"
            >
              <nav className="flex flex-col p-6 gap-5">
                {LINKS.map(link => (
                  <button
                    key={link.href}
                    aria-label={`Navegar para ${link.label}`}
                    onClick={() => handleNavClick(link.href)}
                    className={`text-left text-sm uppercase tracking-[0.2em] transition-colors py-2 border-b border-white/5
                      ${activeSection === link.href ? 'text-white font-bold pl-2' : 'text-white/60 hover:text-white'}`}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            // onClick fecha o menu se clicar fora
            onClick={() => setIsOpen(false)}
            // AQUI ESTÁ O BLUR QUE VOCÊ QUER: backdrop-blur-sm
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  )
}