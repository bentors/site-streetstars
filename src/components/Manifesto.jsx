import manifestoBg from '../assets/images/manifesto-bg.jpg'

export default function Manifesto() {
  return (
    <section id="manifesto" className="py-32 px-6 text-center" 
    style={{ backgroundImage: `url(${manifestoBg})`, backgroundSize: 'cover', 
    backgroundPosition: 'center 12%'}}>
      <div className="max-w-4xl mx-auto">

          <div className="space-y-6">
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-black/60 leading-tight tracking-tight">
              A rua é palco.
            </p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-black/80 leading-tight tracking-tight">
              O corpo é voz.
            </p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-black leading-tight tracking-tight">
              A roupa é mensagem.
            </p>
            <br />
          </div>
          
          <div className="pt-10 border-t border-white/30">
            <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
              <p className="text-xl sm:text-2xl text-white/95 leading-relaxed">
                A Street Stars acredita que estilo é extensão da identidade. 
                <span className="block mt-4">
                  Não seguimos padrões, criamos presença. Vestir Street Stars é viver a rua. Refletir momentos, ideias e vivências.
                </span>
              </p>
            </div>
          </div>
        </div>

    </section>
  )
}