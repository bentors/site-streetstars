import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collections } from '../data/collections.js' 

export default function CollectionPage() {
  const { id } = useParams()
  
  const collectionIndex = parseInt(id)
  const collection = collections[collectionIndex]

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  if (!collection) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Coleção não encontrada</h1>
        <Link to="/" className="border-b border-white pb-1 hover:opacity-70">Voltar para Home</Link>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="relative h-[60vh] md:h-[80vh] w-full">
        <img 
          src={collection.image} 
          alt={collection.title}
          className="w-full h-full object-cover opacity-60" 
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-5xl">
           <div className="flex items-center gap-4 mb-6">
             <Link to="/" state={{scrollTo: 'collections'}} className="text-[10px] uppercase tracking-widest hover:text-white/70 transition-colors">← Voltar</Link>
             <span className="text-[10px] border border-white/30 px-3 py-1 uppercase tracking-widest backdrop-blur-md">
               Editorial Exclusivo
             </span>
           </div>

           <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
             {collection.title}
           </h1>
           
           <p className="text-base md:text-xl text-white/80 max-w-2xl font-light leading-relaxed border-l-2 border-white pl-6">
             {collection.shortDescription || collection.description}
           </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
           
           <div className="aspect-[3/4] bg-zinc-900 overflow-hidden rounded-sm md:sticky md:top-32">
             <img 
               src={collection.imageHover} 
               alt="Detalhe da coleção"
               className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" 
             />
           </div>
           
           <div className="flex flex-col gap-8 p-6 md:p-12 border border-white/10 bg-zinc-900/10">
              <div>
                <h3 className="text-3xl font-display uppercase italic mb-4">O Conceito</h3>
                <p className="text-white/80 text-sm leading-loose text-justify whitespace-pre-line">
                  {collection.fullDescription || collection.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                {collection.credits ? (
                  Object.entries(collection.credits).map(([role, name]) => (
                    <div key={role}>
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{role}</h4>
                      <p className="text-sm capitalize">{name}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Fotografia</h4>
                      <p className="text-sm">Studio Street Stars</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Direção</h4>
                      <p className="text-sm">Creative Team</p>
                    </div>
                  </>
                )}
              </div>
              
              <Link 
                to="/"
                onClick={() => {
                  setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 100)
                }}
                className="inline-block mt-4 text-center py-4 border border-white text-white font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
              >
                Ver Peças Disponíveis
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}