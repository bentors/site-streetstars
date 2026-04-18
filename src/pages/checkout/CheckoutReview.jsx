import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore/lite'
import { motion } from 'framer-motion'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { formatCurrency } from '../../utils/format'
import { formatCEP } from '../../utils/validators'
import { optimizeImage } from '../../utils/image'
import Logo from '../../components/ui/Logo'

export default function CheckoutReview() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userProfile } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()

  const address = location.state?.address

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redireciona se não tem endereço ou carrinho vazio
  if (!address || cartItems.length === 0) {
    navigate('/checkout/endereco', { replace: true })
    return null
  }

  async function handlePlaceOrder() {
    setLoading(true)
    setError(null)

    try {
      // Cria o pedido no Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        status: 'pending',
        total: cartTotal,
        address: { ...address },
        payment: {
          provider: 'mercadopago',
          preferenceId: null,
          paymentId: null,
          method: null,
        },
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      // Cria os itens do pedido na subcoleção
      const itemsRef = collection(db, 'orders', orderRef.id, 'items')
      await Promise.all(
        cartItems.map(item =>
          addDoc(itemsRef, {
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color || null,
            img: item.img || null,
          })
        )
      )

      clearCart()

      // Sprint 3: aqui vai redirecionar para o Mercado Pago
      // Por ora vai para a página de confirmação com o orderId
      navigate(`/pedido/${orderRef.id}`, { replace: true })

    } catch (err) {
      console.error(err)
      setError('Erro ao criar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">

      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo className="h-6 w-auto text-white" />
          </Link>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-mono">
            <Link to="/checkout/endereco" className="text-white/30 hover:text-white transition-colors">
              1. Endereço
            </Link>
            <span className="text-white/20">—</span>
            <span className="text-white font-bold">2. Revisão</span>
            <span className="text-white/20">—</span>
            <span className="text-white/30">3. Pagamento</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-8">
          Revisar Pedido
        </h1>

        <div className="flex flex-col gap-6">

          {/* Itens do carrinho */}
          <section className="border border-white/10 rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/50">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                Itens ({cartItems.length})
              </p>
            </div>

            <div className="divide-y divide-white/5">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-14 h-14 bg-zinc-800 rounded-sm overflow-hidden flex-shrink-0">
                    <img
                      src={optimizeImage(item.img, 200)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-0.5">
                      Tam: {item.size}
                      {item.color && ` · Cor: ${item.color}`}
                      {` · Qtd: ${item.quantity}`}
                    </p>
                  </div>
                  <p className="text-sm font-mono text-white/70 flex-shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Endereço de entrega */}
          <section className="border border-white/10 rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                Endereço de Entrega
              </p>
              <Link
                to="/checkout/endereco"
                className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors font-mono"
              >
                Alterar
              </Link>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                {address.label}
              </p>
              <p className="text-xs text-white/50 font-mono leading-relaxed">
                {address.street}, {address.number}
                {address.complement && ` — ${address.complement}`}<br />
                {address.neighborhood} — {address.city}/{address.state}<br />
                CEP: {formatCEP(address.cep)}
              </p>
            </div>
          </section>

          {/* Frete */}
          <section className="border border-white/10 rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/50">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                Frete
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <p className="text-xs text-white/40 font-mono uppercase tracking-wider">
                Calculado no próximo passo
              </p>
              <p className="text-xs text-white/30 font-mono">
                — —
              </p>
            </div>
          </section>

          {/* Resumo financeiro */}
          <section className="border border-white/10 rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/50">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                Resumo
              </p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50 font-mono uppercase tracking-wider">Subtotal</p>
                <p className="text-xs font-mono text-white/70">{formatCurrency(cartTotal)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50 font-mono uppercase tracking-wider">Frete</p>
                <p className="text-xs font-mono text-white/30">A calcular</p>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-widest text-white">Total</p>
                <p className="text-sm font-black font-mono text-white">{formatCurrency(cartTotal)}</p>
              </div>
            </div>
          </section>

          {/* CPF — necessário para o Mercado Pago */}
          {!userProfile?.cpf && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-yellow-500/20 bg-yellow-500/5 rounded-sm px-5 py-4"
            >
              <p className="text-[10px] uppercase tracking-widest text-yellow-500/70 font-mono leading-relaxed">
                Seu CPF não está cadastrado. Ele será necessário para processar o pagamento.{' '}
                <Link to="/minha-conta" className="underline hover:text-yellow-400 transition-colors">
                  Adicionar agora
                </Link>
              </p>
            </motion.div>
          )}

          {error && (
            <p className="text-red-400 text-xs uppercase tracking-wide font-mono text-center">
              {error}
            </p>
          )}

          {/* Botão finalizar */}
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="group relative w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] overflow-hidden text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Confirmar e Ir para Pagamento
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </button>

          <p className="text-[10px] text-white/20 font-mono text-center uppercase tracking-wider">
            Ao confirmar você será redirecionado para o Mercado Pago para concluir o pagamento com segurança.
          </p>

        </div>
      </main>
    </div>
  )
}