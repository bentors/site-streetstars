import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/images/streetstars_logoprovisoria.webp'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  const [copied, setCopied] = useState(false)
  const EMAIL = 'streetstarsco@gmail.com'

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scrollTo = (id) => {
    if (id === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer id='footer' className="bg-black text-white pt-20 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          <div className="md:col-span-4 space-y-6">
            <button onClick={() => scrollTo('top')} className="block">
              <img src={logo} alt="Street Stars" className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity" />
            </button>
            
            <p className="text-white/50 text-xs leading-relaxed max-w-xs font-light">
              Criando estrelas. Street Stars.
              <br/>
              Est. 2024 — São Paulo.
            </p>

            <div className="pt-4 border-t border-white/10 w-fit">
              <p className="text-white/80 italic font-display text-sm">
                "Da rua pra rua. <br/> Sem intermediários."
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white/90">Menu</h4>
            <ul className="space-y-3 text-xs text-white/50">
              <li><button onClick={() => scrollTo('top')} className="hover:text-white transition-colors">Início</button></li>
              <li><button onClick={() => scrollTo('shop')} className="hover:text-white transition-colors">Shop</button></li>
              <li><button onClick={() => scrollTo('collections')} className="hover:text-white transition-colors">Coleções</button></li>
              <li><button onClick={() => scrollTo('manifesto')} className="hover:text-white transition-colors">Manifesto</button></li>
              <li><button onClick={() => scrollTo('about')} className="hover:text-white transition-colors">Quem Somos</button></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white/90">Contato</h4>
            
            <div className="flex flex-col gap-4">
              <a 
                href="https://www.instagram.com/_streetstars.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 border border-white/10 hover:border-white/30 bg-zinc-900/30 hover:bg-zinc-900 transition-all rounded-sm"
              >
                <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Instagram</span>
                  <span className="text-xs font-bold text-white">@_streetstars.co</span>
                </div>
              </a>

              <button 
                onClick={copyEmail}
                className="group flex items-center gap-3 p-3 border border-white/10 hover:border-white/30 bg-zinc-900/30 hover:bg-zinc-900 transition-all rounded-sm text-left"
              >
                {copied ? (
                   <span className="text-green-500 font-bold text-xs w-5 flex justify-center">✓</span>
                ) : (
                   <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                )}
                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Email</span>
                  <span className="text-xs font-bold text-white font-mono">{copied ? 'Copiado para o clipboard!' : 'streetstarsco@gmail.com'}</span>
                </div>
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
             <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white/90">Legal</h4>
             <ul className="space-y-3 text-xs text-white/50">
                <li><Link to="#" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Trocas e Devoluções</Link></li>
             </ul>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-white/30 uppercase tracking-widest text-center md:text-left">
            © {currentYear} Street Stars. Todos os direitos reservados.
          </p>
          
          <div className="flex gap-3 grayscale opacity-30">
             <div className="w-8 h-5 bg-white/20 rounded-[2px]"></div>
             <div className="w-8 h-5 bg-white/20 rounded-[2px]"></div>
             <div className="w-8 h-5 bg-white/20 rounded-[2px]"></div>
          </div>
        </div>

      </div>
    </footer>
  )
}