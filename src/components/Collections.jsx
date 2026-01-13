import { collections } from '../data/collections'

export default function Collections() {
  return (
    <section id="collections" className="py-32 px-6 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-display mb-16 text-center">
          Coleções
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {collections.map((item, index) => (
            <div
              key={index}
              className="group border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-300 hover:translate-y-1"
            >

              <div className="relative w-full aspect-square overflow-hidden">

                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-110"
                />

                <img
                  src={item.imageHover}
                  alt={`${item.title} - visão alternativa`}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 scale-105 group-hover:scale-100"
                />
              </div>

              <div className="p-6">
                <h3 className="font-display text-xl mb-2">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed ">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}