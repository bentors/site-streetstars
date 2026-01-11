import { useState } from 'react'
import logo from '../assets/streetstars_logoprovisoria.jpeg'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <img
          src={logo}
          alt="Street Stars"
          className="h-8 w-auto object-contain"
        />

        <nav className="hidden md:flex gap-8 text-sm text-white/70">
          <a href="#about" className="hover:text-white transition">Sobre</a>
          <a href="#collections" className="hover:text-white transition">Coleções</a>
          <a href="#manifesto" className="hover:text-white transition">Manifesto</a>
          <a href="#contact" className="hover:text-white transition">Contato</a>
          <a href="#shop" className="hover:text-white transition">Shop</a>
        </nav>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white/70 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur border-t border-white/10">
          <nav className="px-6 py-4 flex flex-col gap-4 text-sm text-white/70">
            <a href="#about" className="hover:text-white transition" onClick={() => setIsOpen(false)}>Sobre</a>
            <a href="#collections" className="hover:text-white transition" onClick={() => setIsOpen(false)}>Coleções</a>
            <a href="#manifesto" className="hover:text-white transition" onClick={() => setIsOpen(false)}>Manifesto</a>
            <a href="#contact" className="hover:text-white transition" onClick={() => setIsOpen(false)}>Contato</a>
            <a href="#shop" className="hover:text-white transition" onClick={() => setIsOpen(false)}>Shop</a>
          </nav>
        </div>
      )}
    </header>
  )
}
