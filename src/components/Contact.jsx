import { useState } from 'react'
import { FaInstagram, FaEnvelope, FaTiktok } from 'react-icons/fa'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText('streetstarsco@gmail.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="contact" className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-neutral-950 overflow-hidden">
      
  <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden sm:block"></div>      
      <div className="max-w-5xl mx-auto relative">
        
        <div className="text-center mb-12 sm:mb-16">
          <br />
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm tracking-widest text-white/60 py-1">FALE COM A GENTE</span>
          </div>
        </div>  

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-6 lg:gap-10">
          
        <div className="border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-white/30 transition-all duration-500 group bg-gradient-to-br from-black to-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              <FaInstagram className="text-pink-500" size={24} sm:size={30} />
              <div>
                <h3 className="text-2xl font-display">Instagram</h3>
                <p className="text-white/60">@_streetstars.co</p>
              </div>
            </div>
            <p className="text-white/70 mb-6">
              Onde postamos daily fits, drops exclusivos e a cultura street em tempo real.
            </p>
            <a
              href="https://www.instagram.com/_streetstars.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-all"
            >
              Seguir agora
              <span className="group-hover:translate-x-1 transition">→</span>
            </a>
          </div>

          <div className="border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-white/30 transition-all duration-500 bg-gradient-to-br from-gray-900 to-black group">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              <FaEnvelope className="text-pink-500" size={24} sm:size={30} />
              <div>
                <h3 className="text-2xl font-display">Email direto</h3>
                <p className="text-white/60">Para parcerias, imprensa e dúvidas comerciais.</p>
              </div>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <code className="text-xs sm:text-sm lg:text-base font-mono bg-black px-3 py-2 rounded break-all border border-white/10">
                  streetstarsco@gmail.com
                </code>
                <button
                  onClick={copyEmail}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm bg-white/10 hover:bg-white/20 rounded border border-white/20 text-sm transition"
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <a
              href="mailto:streetstarsco@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-all"
            >
              Abrir email
              <span className="group-hover:translate-x-1 transition">→</span>
            </a>
          </div>
        </div>

        <div className="text-center mt-16 pt-8 border-t border-white/10">
          <p className="text-white/50 italic">
            "Da rua pra rua. Sem intermediários."
          </p>
        </div>
      </div>
    </section>
  )
}