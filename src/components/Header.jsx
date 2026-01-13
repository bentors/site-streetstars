import { useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import logo from '../assets/streetstars_logoprovisoria.jpeg'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40)
})

  const links = [
    { label: 'Sobre', href: '#about' },
    { label: 'Coleções', href: '#collections' },
    { label: 'Manifesto', href: '#manifesto' },
    { label: 'Contato', href: '#contact' },
    { label: 'Shop', href: '#shop' },
]


  return (
    <motion.header 
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500
      ${scrolled 
        ? 'bg-black/90 backdrop-blur-xl shadow-lg border-b border-white/10' 
        : 'bg-black/40 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between transition-all duration-300">
        <a href="#top">
          <img
            src={logo}
            alt="Street Stars"
            className="h-8 w-auto object-contain"
          />
        </a>

        <nav className="hidden md:flex gap-8 text-sm text-white/70">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-white transition"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label='Abrir Menu'
          aria-expanded={isOpen}
          className="md:hidden text-white/70 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur border-t border-white/10 animate-slideDown">
          <nav className="px-6 py-4 flex flex-col gap-4 text-sm text-white/70">
            {links.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-white transition"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </motion.header>
  )
}
