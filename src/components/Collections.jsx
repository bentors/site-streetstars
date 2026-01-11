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
              className="group border border-white/10 overflow-hidden"
            >
              <img
                src={item.image}
                className="w-full aspect-square object-cover group-hover:scale-105 transition duration-500"
              />

              <div className="p-6">
                <h3 className="font-display text-xl mb-2">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm">
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
