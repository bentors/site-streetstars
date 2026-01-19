import { useState, useEffect } from 'react'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import logo from '../assets/images/streetstars_logoprovisoria.webp'
import { scrollToSection } from '../utils/scrollToSection'

const LINKS = [
  { label: 'Shop', href: '#shop' },
  { label: 'Coleções', href: '#collections' },
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Quem somos', href: '#about' },
  { label: 'Contato', href: '#contact' },
]

export default function Header({ setOverlayActive }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const { scrollY } = useScroll()

  const cartCount = 0 

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40)
  })

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`)
        }
      })
    }, { rootMargin: '-40% 0px -50% 0px' })

    const timer = setTimeout(() => {
      document.querySelectorAll('section[id]').forEach(section => observer.observe(section))
    }, 1000)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return (
    <motion.header 
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500
      ${scrolled 
        ? 'bg-black shadow-xl border-b border-white/10'
        : 'bg-black/40 backdrop-blur-sm'}`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <button onClick={() => scrollToSection('#top')}>
          <img
            src={logo}
            alt="Street Stars"
            className="h-8 w-auto object-contain hover:opacity-80 transition"
          />
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className={`relative text-xs uppercase tracking-widest transition-colors
                ${activeSection === link.href ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {link.label}
              {activeSection === link.href && (
                <motion.span
                  layoutId="star-underline"
                  className="absolute -bottom-3 left-0 right-0 flex justify-center text-[10px]"
                >
                  -★-
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <button className="relative p-1 text-white/80 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setIsOpen(!isOpen); setOverlayActive(!isOpen); }}
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
            className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <nav className="flex flex-col p-6 gap-5">
              {LINKS.map(link => (
                <button
                  key={link.href}
                  onClick={() => { 
                    scrollToSection(link.href); 
                    setIsOpen(false); 
                    setOverlayActive(false); 
                  }}
                  className="text-left text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}