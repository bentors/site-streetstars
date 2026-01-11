export default function Contact() {
  return (
    <section id="contact" className="py-32 px-6 bg-neutral-950">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-display mb-6">Contato</h2>

        <p className="text-white/60 mb-10">
          Quer colaborar, saber mais ou acompanhar os próximos lançamentos?
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a
            href="https://www.instagram.com/_streetstars.co/"
            target="_blank"
            className="px-8 py-3 border border-white/30 hover:border-white transition"
          >
            Instagram
          </a>

          <a
            href="mailto:contato@streetstars.com"
            className="px-8 py-3 bg-white text-black font-semibold"
          >
            Fale conosco
          </a>
        </div>
      </div>
    </section>
  )
}
