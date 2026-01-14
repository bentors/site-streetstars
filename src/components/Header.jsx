import { useState , useEffect  } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import logo from '../assets/streetstars_logoprovisoria.jpeg'
import { scrollToSection } from '../utils/scrollToSection'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState(null)


  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40)
  })

  useEffect(() => {
  const sections = document.querySelectorAll('section[id]')

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    },
    {
      rootMargin: '-40% 0px -50% 0px',
      threshold: 0
    }
  )

  sections.forEach(section => observer.observe(section))

  return () => observer.disconnect()
  }, [])


  const links = [
    { label: 'Sobre', href: '#about' },
    { label: 'Coleções', href: '#collections' },
    { label: 'Manifesto', href: '#manifesto' },
    { label: 'Contato', href: '#contact' },
    { label: 'Shop', href: '#shop' },
]

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
  if (isOpen && window.innerWidth >= 768) {
    setIsOpen(false)
  }
}, [isOpen])

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
        <button
          onClick={() => scrollToSection('#top')}
          aria-label="Voltar ao topo"
        >
          <img
            src={logo}
            alt="Street Stars"
            className="h-8 w-auto object-contain"
          />
        </button>


        <nav className="hidden md:flex gap-8 text-sm text-white/70 relative">
          {links.map(link => (
            <div key={link.href} className="relative">
              <button
                onClick={() => scrollToSection(link.href)}
                className="relative hover:text-white transition"
              >
                {link.label}

                {activeSection === link.href.substring(1) && (
                  <motion.span
                    layoutId="star-underline"
                    className="absolute -bottom-2 left-0 right-0 flex justify-center"
                  >
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-[1.5px] bg-white/80" />
                      <span className="text-white text-xs">★</span>
                      <span className="w-4 h-[1.5px] bg-white/80" />
                    </span>
                  </motion.span>
                )}
              </button>
            </div>
          ))}
        </nav>



        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label='Abrir Menu'
          aria-expanded={isOpen}
          className="md:hidden text-white/70 hover:text-white"
        >
          <svg className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur border-t border-white/10 animate-slideDown">
          <nav className="px-6 py-4 flex flex-col gap-4 text-sm text-white/70">
            {links.map(link => (
              <button
                onClick={() => {
                  scrollToSection(link.href)
                  setIsOpen(false)
                }}
                className="text-left hover:text-white transition"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </motion.header>
  )
}
