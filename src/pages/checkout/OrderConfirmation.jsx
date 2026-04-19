import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../../components/ui/Logo'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')

  const config = {
    success: {
      icon: (
        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: 'Pagamento Confirmado',
      message: 'Seu pedido foi pago com sucesso. Em breve você receberá atualizações sobre o envio.',
    },
    failure: {
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: 'Pagamento Recusado',
      message: 'Houve um problema com o pagamento. Tente novamente com outro método.',
    },
    pending: {
      icon: (
        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Pagamento Pendente',
      message: 'Seu pagamento está sendo processado. Avisaremos quando for confirmado.',
    },
  }

  const current = config[status] || config.pending

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 selection:bg-white selection:text-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
      >
        <Link to="/" className="mb-10 hover:opacity-80 transition-opacity">
          <Logo className="h-10 w-auto text-white" />
        </Link>

        <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mb-6">
          {current.icon}
        </div>

        <h1 className="text-xl font-black uppercase italic tracking-tighter mb-3">
          {current.title}
        </h1>

        <p className="text-xs text-white/40 font-mono leading-relaxed mb-2">
          {current.message}
        </p>

        <p className="text-[10px] text-white/20 font-mono mb-8">
          #{orderId}
        </p>

        <div className="flex flex-col gap-3 w-full">
          {status === 'failure' ? (
            <Link
              to="/checkout/endereco"
              className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-all text-xs text-center"
            >
              Tentar Novamente
            </Link>
          ) : (
            <Link
              to="/minha-conta"
              state={{ tab: 'orders' }}
              className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-all text-xs text-center"
            >
              Ver Meus Pedidos
            </Link>
          )}
          <Link
            to="/"
            className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
          >
            Voltar à Loja
          </Link>
        </div>
      </motion.div>
    </div>
  )
}