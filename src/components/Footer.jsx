import { scrollToSection } from '../utils/scrollToSection'

export default function Footer() {
  const links = [
    { label: 'Sobre', href: '#about' },
    { label: 'Coleções', href: '#collections' },
    { label: 'Manifesto', href: '#manifesto' },
    { label: 'Contato', href: '#contact' },
    { label: 'FAQ', href: '#' },
    { label: 'Trocas', href: '#' },
  ]

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-6 md:gap-12 mb-6">
          {links.map(link => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="text-white/70 hover:text-white hover:translate-y-[1px] transition-all text-sm"
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div>
              <div className="text-center md:text-left font-display mb-2">STREET STARS</div>
              <p className="text-white/50 text-xs">
                Desde 2024 • São Paulo, BR
              </p>
            </div>

            <div className="text-2xl font-display mb-2 text-center md:text-right">
              <p className="text-white/50 text-xs">
                © {new Date().getFullYear()} Street Stars<br/>
                Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/50 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <div>
              <a href="#" className="hover:text-white/70 transition">Política de Privacidade</a>
              <span className="mx-2">•</span>
              <a href="#" className="hover:text-white/70 transition">Termos de Uso</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}