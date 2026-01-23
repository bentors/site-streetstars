import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/images/streetstars_logoprovisoria.webp'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [copied, setCopied] = useState(false)

  const EMAIL = 'streetstarsco@gmail.com'
  const WHATSAPP_NUMBER = '5511999999999'

  const location = useLocation()
  const navigate = useNavigate()

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNavigation = (sectionId) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } })
      setTimeout(() => {
         const element = document.getElementById(sectionId)
         if(element) element.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer id='footer' className="bg-black text-white pt-20 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">

          <div className="md:col-span-4 space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
            <button onClick={() => handleNavigation('top')} className="block">
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

          <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white/90">Contato</h4>
            
            <div className="flex flex-col gap-4 w-full max-w-sm"> 

              <a 
                href="https://www.instagram.com/_streetstars.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 p-2 border border-white/10 hover:border-white/30 bg-zinc-900/30 hover:bg-zinc-900 transition-all rounded-sm text-left"
              >
                <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Instagram</span>
                  <span className="text-xs font-bold text-white">@_streetstars.co</span>
                </div>
              </a>

              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 p-2 border border-white/10 hover:border-white/30 bg-zinc-900/30 hover:bg-zinc-900 transition-all rounded-sm text-left"
              >
                <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Whatsapp</span>
                  <span className="text-xs font-bold text-white">Fale Conosco</span>
                </div>
              </a>

              <button 
                onClick={copyEmail}
                aria-label='Copiar Email'
                className="group w-full flex items-center gap-3 p-2 border border-white/10 hover:border-white/30 bg-zinc-900/30 hover:bg-zinc-900 transition-all rounded-sm text-left"
              >
                {copied ? (
                   <span className="text-green-500 font-bold text-xs w-5 flex justify-center flex-shrink-0">✓</span>
                ) : (
                   <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                )}
                
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Email</span>
                  <span className="text-xs font-bold text-white font-mono truncate">{copied ? 'Copiado!' : 'streetstarsco@gmail.com'}</span>
                </div>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white/90">Menu</h4>
            <ul className="space-y-3 text-xs text-white/50 w-full">
              <li><button aria-label='Ir para Início' onClick={() => handleNavigation('top')} className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Início</button></li>
              <li><button aria-label='Ir para Shop' onClick={() => handleNavigation('shop')} className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Shop</button></li>
              <li><button aria-label='Ir para Coleções' onClick={() => handleNavigation('collections')} className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Coleções</button></li>
              <li><button aria-label='Ir para Manifesto' onClick={() => handleNavigation('manifesto')} className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Manifesto</button></li>
              <li><button aria-label='Ir para História' onClick={() => handleNavigation('about')} className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Quem Somos</button></li>
            </ul>
          </div>

          <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
             <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-white/90">Legal</h4>
             <ul className="space-y-3 text-xs text-white/50 w-full">
               <li><Link to="/" className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Política de Privacidade</Link></li>
               <li><Link to="/" className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Termos de Uso</Link></li>
               <li><Link to="/" className="hover:text-white transition-colors py-1 block w-full text-center md:text-left">Trocas e Devoluções</Link></li>
             </ul>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-white/30 uppercase tracking-widest text-center md:text-left">
            © {currentYear} Street Stars. Todos os direitos reservados.
          </p>
          
          <div className="flex gap-2">
             <PaymentBadge>PIX</PaymentBadge>
             <PaymentBadge>VISA</PaymentBadge>
             <PaymentBadge>MASTER</PaymentBadge>
          </div>
        </div>

      </div>
    </footer>
  )
}

function PaymentBadge({ children }) {
  return (
    <div className="h-6 px-2 border border-white/10 rounded-[2px] flex items-center justify-center bg-white/5 text-[9px] font-bold text-white/50 tracking-widest cursor-default">
      {children}
    </div>
  )
}