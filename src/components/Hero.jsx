import hero from '../assets/images/hero.jpg'

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center text-center px-6 relative overflow-hidden">
      <img
        src={hero}
        alt=''
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-cover opacity-80 object-[78%_center]"
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative max-w-4xl animate-fadeUp">
        <p className="text-xs tracking-[0.35em] text-white/50 mb-6">
          STREET STARS
        </p>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-8">
          Estrelas nascem <br /> nas ruas
        </h1>

        <p className="text-white/70 max-w-2xl mx-auto mb-10">
          A Street Stars nasce da rua, da cultura urbana e da expressão individual. <br/>
          Mais do que roupas, criamos identidade.
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="#collections"
            className="px-8 py-3 bg-white text-black font-semibold hover:scale-105 transition rounded-md"
          >
            Conheça as coleções
          </a>
        </div>
      </div>
    </section>
  )
}
