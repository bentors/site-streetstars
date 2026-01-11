export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-6">
          <a href="#about" className="text-white/60 hover:text-white text-sm transition">Sobre</a>
          <a href="#collections" className="text-white/60 hover:text-white text-sm transition">Coleções</a>
          <a href="#manifesto" className="text-white/60 hover:text-white text-sm transition">Manifesto</a>
          <a href="#contact" className="text-white/60 hover:text-white text-sm transition">Contato</a>
          <a href="#" className="text-white/60 hover:text-white text-sm transition">FAQ</a>
          <a href="#" className="text-white/60 hover:text-white text-sm transition">Trocas</a>
        </div>
      </div>

      <div className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div>
              <div className="text-2xl font-display mb-2">STREET STARS</div>
              <p className="text-white/40 text-xs">
                Desde 2024 • São Paulo, BR
              </p>
            </div>

            <div className="text-center max-w-md">
              <p className="text-white/50 text-sm italic">
                "Estrelas nascem nas ruas."
              </p>
            </div>

            <div className="text-right">
              <p className="text-white/40 text-sm">
                © {new Date().getFullYear()}<br/>
                Todos os direitos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/50 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
            <div>
              <a href="#" className="hover:text-white/60 transition">Política de Privacidade</a>
              <span className="mx-2">•</span>
              <a href="#" className="hover:text-white/60 transition">Termos de Uso</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}