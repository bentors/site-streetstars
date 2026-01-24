import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900/20" />
      
      <motion.h1 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-[150px] md:text-[200px] font-black leading-none tracking-tighter text-white/5 select-none"
      >
        404
      </motion.h1>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-widest mb-8">
          ESSA ESTRELA SE PERDEU NO CAMINHO
        </h2>
        <p className="text-white/50 mb-16 max-w-md">
          A página que você tá procurando não tá mais aqui. <br /> Ou tá brilhando em outro canto do universo.
          <br /> <br /> Mas relaxa, a gente te leva de volta pra rua.
        </p>

        <Link 
          to="/"
          className="px-12 py-3 bg-white text-black font-bold rounded-full uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  )
}