import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../utils/format'
import Logo from '../../components/ui/Logo'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { doc, onSnapshot } from 'firebase/firestore'
import { getRealtimeDb } from '../../services/firebase'

const STATUS_CONFIG = {
  pending: {
    icon: (
      <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Aguardando Pagamento',
    message: 'Seu pagamento está sendo processado. Esta página atualiza automaticamente.',
    color: 'text-yellow-400',
  },
  paid: {
    icon: (
      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: 'Pagamento Confirmado',
    message: 'Seu pedido foi pago com sucesso. Em breve você receberá atualizações sobre o envio.',
    color: 'text-green-400',
  },
  cancelled: {
    icon: (
      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    title: 'Pagamento Recusado',
    message: 'Houve um problema com o pagamento. Tente novamente com outro método.',
    color: 'text-red-400',
  },
}

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const initialStatus = searchParams.get('status') === 'success' ? 'paid'
    : searchParams.get('status') === 'failure' ? 'cancelled'
    : 'pending'

  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState(initialStatus)
  const [items, setItems] = useState([])
  const { clearCart } = useCart()

  useEffect(() => {
    if (status === 'paid') {
      clearCart()
    }
  }, [status])

  useEffect(() => {
    if (!orderId || !user) return

    let unsubscribe = () => {}

    getRealtimeDb().then(dbRt => {
      const orderRef = doc(dbRt, 'orders', orderId)
      unsubscribe = onSnapshot(orderRef, (snap) => {
        if (!snap.exists()) {
          navigate('/', { replace: true })
          return
        }

        const data = snap.data()

        // Verifica se o pedido pertence ao usuário autenticado
        // A Firestore Rule já bloqueia no nível de dados,
        // mas esta verificação evita exibir dados por milissegundos antes da Rule agir
        if (data.userId !== user.uid) {
          navigate('/', { replace: true })
          return
        }

        setOrder(data)
        setStatus(data.status)
      })
    })

    return () => unsubscribe()
  }, [orderId, user, navigate])

  useEffect(() => {
    if (!orderId || !user) return

    async function loadItems() {
      try {
        const { collection, getDocs } = await import('firebase/firestore/lite')
        const { db: dbLite } = await import('../../services/firebase')
        const snap = await getDocs(collection(dbLite, 'orders', orderId, 'items'))
        setItems(snap.docs.map(d => d.data()))
      } catch (err) {
        console.error('Erro ao carregar itens:', err)
      }
    }
    loadItems()
  }, [orderId, user])

  const current = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 max-w-lg mx-auto px-6 py-16 flex flex-col items-center text-center">

        <Link to="/" className="mb-10 hover:opacity-80 transition-opacity">
          <Logo className="h-10 w-auto text-white" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
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

          {/* Itens do pedido */}
          {items.length > 0 && (
            <div className="w-full border border-white/10 rounded-sm overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/50 text-left">
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                  Itens do Pedido
                </p>
              </div>
              <div className="divide-y divide-white/5">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between px-5 py-3">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">
                        Tam: {item.size}
                        {item.color && ` · Cor: ${item.color}`}
                        {` · Qtd: ${item.quantity}`}
                      </p>
                    </div>
                    <p className="text-xs font-mono text-white/70">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              {order?.total && (
                <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between bg-zinc-900/30">
                  <p className="text-xs font-black uppercase tracking-widest text-white">Total</p>
                  <p className="text-xs font-black font-mono text-white">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Endereço */}
          {order?.address && (
            <div className="w-full border border-white/10 rounded-sm overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/50 text-left">
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                  Endereço de Entrega
                </p>
              </div>
              <div className="px-5 py-4 text-left">
                <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  {order.address.label}
                </p>
                <p className="text-xs text-white/50 font-mono leading-relaxed">
                  {order.address.street}, {order.address.number}
                  {order.address.complement && ` — ${order.address.complement}`}<br />
                  {order.address.neighborhood} — {order.address.city}/{order.address.state}
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-3 w-full">
            {status === 'cancelled' ? (
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
    </div>
  )
}