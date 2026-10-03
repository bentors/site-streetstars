import { motion, AnimatePresence } from 'framer-motion'

export default function Overlay({ active, onClick }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClick}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-pointer"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )
}