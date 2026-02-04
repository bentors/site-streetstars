import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center gap-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative flex items-center justify-center"
      >
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/5 border-b-white/50 rounded-full animate-spin-reverse" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col items-center gap-2"
      >
        <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-bold">
          Street Stars
        </p>
        
        <div className="flex gap-1" aria-hidden="true">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay }}
              className="w-1 h-1 bg-white/40 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}