import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import Logo from '../../components/ui/Logo'

const HeaderSearch = lazy(() => import('../shop/HeaderSearch'))

const LINKS = [
  { label: 'Shop', href: '#shop' },
  { label: 'Coleções', href: '#collections' },
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Quem somos', href: '#about' },
  { label: 'Contato', href: '#footer' },
]

const SearchFallback = () => (
  <button aria-label="Carregando busca" className="w-10 h-10 flex items-center justify-center text-white/80">
     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
     </svg>
  </button>
)

export default function Header({ setOverlayActive }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState(null)

  const isNavigatingRef = useRef(false)
  const headerRef = useRef(null)
  const menuButtonRef = useRef(null)
  
  const { scrollY } = useScroll()
  const { setIsCartOpen, cartCount } = useCart()
  
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsOpen(false)
        setOverlayActive?.(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setOverlayActive])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setOverlayActive?.(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, setOverlayActive])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(isHome ? latest > 40 : true)
  })

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      setActiveSection(null)
    }
  }, [isHome])

useEffect(() => {
    if (!isHome) return

    const observerOptions = {
      root: null, 
      rootMargin: '-40% 0px -50% 0px', 
    }

    const observer = new IntersectionObserver((entries) => {
      if (isNavigatingRef.current) return

      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100

      if (scrolledToBottom) {
        setActiveSection('#footer')
        return
      }

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`)
        }
      })
    }, observerOptions)

    const attachObserver = () => {
      const sections = document.querySelectorAll('section[id], footer[id]')
      sections.forEach(section => observer.observe(section))
    }

    const t1 = setTimeout(attachObserver, 100)
    
    const t2 = setTimeout(attachObserver, 1000)

    const t3 = setTimeout(attachObserver, 3000)

    const handleScroll = () => {
      if (isNavigatingRef.current) return
      
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100

      if (scrolledToBottom) {
        setActiveSection('#footer')
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isHome])

  const handleNavClick = useCallback((href) => {
    setActiveSection(href)
    setIsOpen(false)
    setOverlayActive?.(false)
    
    isNavigatingRef.current = true

    const scrollToTarget = () => {
      const element = document.querySelector(href)
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 60
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }

    if (isHome) {
      setTimeout(() => scrollToTarget(), 100)
      setTimeout(() => { isNavigatingRef.current = false }, 1000)
    } else {
      navigate('/')
      setTimeout(() => {
        scrollToTarget()
        setTimeout(() => { isNavigatingRef.current = false }, 1000)
      }, 300)
    }
  }, [isHome, navigate, setOverlayActive])

  const handleLogoClick = useCallback(() => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/')
    }
    setIsOpen(false)
    setOverlayActive?.(false)
  }, [isHome, navigate, setOverlayActive])

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

          <button 
            onClick={handleLogoClick} 
            aria-label="Ir para página inicial"
          >
            <Logo 
              className="h-8 md:h-12 w-auto text-white hover:opacity-80 transition-opacity" 
            />
          </button>

          <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
            {LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`relative text-xs uppercase tracking-widest transition-colors
                  ${activeSection === link.href ? 'text-white font-bold' : 'text-white/60 hover:text-white'}`}
              >
                {link.label}
                {activeSection === link.href && (
                  <motion.span
                    layoutId="star-underline"
                    className="absolute -bottom-2 left-0 right-0 flex justify-center text-[10px] text-white"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    aria-hidden="true"
                  >
                    ★
                  </motion.span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-4">

            <Suspense fallback={<SearchFallback />}>
              <HeaderSearch />
            </Suspense>

            <button 
              onClick={() => setIsCartOpen(true)} 
              aria-label={`Abrir carrinho${cartCount > 0 ? ` (${cartCount} ${cartCount === 1 ? 'item' : 'itens'})` : ''}`}
              className="relative w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-1 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              ref={menuButtonRef}
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isOpen}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <nav className="flex flex-col p-6 gap-5" aria-label="Navegação mobile">
                {LINKS.map(link => (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className={`text-left text-sm uppercase tracking-[0.2em] transition-colors py-2 border-b border-white/5 
                      ${activeSection === link.href 
                        ? 'text-white font-bold border-l-2 border-white pl-4'
                        : 'text-white/60 hover:text-white'}`}
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
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  )
}