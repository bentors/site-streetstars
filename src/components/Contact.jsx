import { useState } from 'react'
import { FaInstagram, FaEnvelope, FaTiktok } from 'react-icons/fa'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText('streetstarsco@gmail.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const EMAIL = 'streetstarsco@gmail.com'


  return (
    <section id="contact" 
      className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 bg-neutral-950 overflow-hidden">
      
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden sm:block"></div>      
      <div className="max-w-5xl mx-auto relative">
        
        <div className="text-center mb-12 sm:mb-16 mt-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm tracking-widest text-white/70 py-1">FALE COM A GENTE</span>
          </div>
        </div>  

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6 lg:gap-10">
          
        <div className="border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-white/30 transition-all duration-500 group bg-gradient-to-br from-black to-zinc-900 flex flex-col">
          <div className='flex-1'>
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6 text-center sm:text-left">
              <FaInstagram className="text-pink-500" 
                size={28} 
                sm:size={30}
              />

              <div>
                <h3 className="text-2xl font-display">Instagram</h3>
                <p className="text-white/70 text-md sm:text-base mb-4 sm:mb-6">@_streetstars.co</p>
              </div>
            </div>

            <p className="mt-8 text-white/80 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
              Onde postamos daily fits, drops exclusivos e a cultura street em tempo real.
            </p>
          </div>

          <a
            href="https://www.instagram.com/_streetstars.co/"
            target="_blank"
            aria-label="Seguir Street Stars no Instagram"
            rel="noopener noreferrer"
            className="mt-4 w-full h-14 flex items-center justify-center gap-2 px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black hover:scale-[1.03] active:scale-95 duration-300 transition-all"
          >
            Seguir agora
            <span className="group-hover:translate-x-1 transition">→</span>
          </a>
        </div>

        <div className="border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-white/30 transition-all duration-500 bg-gradient-to-br from-zinc-900 to-black group flex flex-col">
          <div className='flex-1'>
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4 sm:mb-6 text-center sm:text-left">
              <FaEnvelope className="text-pink-500" 
                size={28} 
                sm:size={30} 
              />
              <div>
                <h3 className="text-2xl font-display">Email</h3>
                <p className="text-white/80 text-sm sm:text-base mb-4 sm:mb-6">Para parcerias e dúvidas comerciais.</p>
              </div>
            </div>
          </div>
            
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <code className="text-xs sm:text-sm lg:text-base font-mono bg-black px-3 py-2 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-full break-normal border border-white/10">
                streetstarsco@gmail.com
              </code>
              <button
                onClick={copyEmail}
                aria-label='Copiar endereço de email'
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm bg-white/10 hover:bg-white/20 rounded border border-white/20 text-sm transition"
              >
                {copied ? '✓ Copiado! ' : 'Copiar'}
              </button>
            </div>
          </div>

          <a
            href={`mailto:${EMAIL}`}
            aria-label='Enviar email para a Street Stars'
            className="mt-4 w-full h-14 flex items-center justify-center gap-2 px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-all"
          >
            Abrir email
            <span className="group-hover:translate-x-1 transition">→</span>
          </a>
        </div>
      </div>

      <div className="text-center mt-16 pt-8 border-t border-white/10">
        <p className="text-white/60 italic">
          "Da rua pra rua. Sem intermediários."
        </p>
        </div>
      </div>
    </section>
  )
}