import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { collections } from '../data/collections'

export default function CollectionPage() {
  const { id } = useParams()
  const collection = collections[id] || collections[0] 

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  return (
    <div className="bg-black min-h-screen text-white">
        <div className="max-w-7xl mx-auto px-6 mb-8">
            <button 
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Voltar
            </button>
        </div>
      <div className="relative h-[70vh] w-full">
        <img src={collection.image} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-4xl">
           <span className="text-[10px] border border-white/30 px-3 py-1 uppercase tracking-widest mb-4 inline-block backdrop-blur-md">
             Editorial Exclusivo
           </span>
           <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter mb-4">
             {collection.title}
           </h1>
           <p className="text-lg text-white/70 max-w-xl font-light leading-relaxed">
             {collection.description}
           </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="aspect-[3/4] bg-zinc-900">
             <img src={collection.imageHover} className="w-full h-full object-cover" />
           </div>
           <div className="flex flex-col justify-center p-8 border border-white/10">
              <h3 className="text-2xl font-display uppercase italic mb-4">Conceito</h3>
              <p className="text-white/60 text-sm leading-loose">
                "A noite não tem fim" explora a dualidade entre o caos urbano e a serenidade da madrugada. 
                Tecidos técnicos encontram cortes clássicos nesta coleção cápsula inspirada na arquitetura brutalista de São Paulo.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}