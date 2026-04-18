import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { doc, updateDoc, addDoc, collection, getDocs, deleteDoc } from 'firebase/firestore/lite'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/ui/Logo'
import { validateCPF, formatCPF, formatPhone, formatCEP } from '../../utils/validators'
import { formatCurrency } from '../../utils/format'

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'addresses', label: 'Endereços' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'security', label: 'Segurança' },
]

export default function MyAccount() {
  const { user, userProfile, logout, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile')

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo className="h-6 w-auto text-white" />
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
              Minha Conta
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[10px] uppercase tracking-widest text-white/50 hover:text-red-500 transition-colors font-bold"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Saudação */}
        <div className="mb-8">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">
            Olá, {userProfile?.name?.split(' ')[0] || 'Estrela'} ⭐
          </h1>
          <p className="text-white/40 text-xs font-mono mt-1">{user?.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-[11px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das Tabs */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                userProfile={userProfile}
                refreshProfile={refreshProfile}
              />
            )}
            {activeTab === 'addresses' && (
              <AddressesTab user={user} />
            )}
            {activeTab === 'orders' && (
              <OrdersTab user={user} />
            )}
            {activeTab === 'security' && (
              <SecurityTab user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ─── Tab: Perfil ────────────────────────────────────────────────────────────

function ProfileTab({ user, userProfile, refreshProfile }) {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    cpf: userProfile?.cpf ? formatCPF(userProfile.cpf) : '',
    marketingConsent: userProfile?.marketingConsent || false,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, cpf: formatCPF(value) }))
      return
    }
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhone(value) }))
      return
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (formData.cpf && !validateCPF(formData.cpf)) {
      setError('CPF inválido.')
      return
    }

    setLoading(true)

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        cpf: formData.cpf.replace(/\D/g, ''),
        marketingConsent: formData.marketingConsent,
      })
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
          Nome Completo
        </label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full bg-zinc-900 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono"
          required
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
          E-mail
        </label>
        <input
          value={user?.email}
          disabled
          className="w-full bg-zinc-900/50 border border-white/5 text-white/30 p-3 text-sm font-mono cursor-not-allowed"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
          CPF <span className="text-white/20">(opcional)</span>
        </label>
        <input
          name="cpf"
          value={formData.cpf}
          onChange={handleChange}
          maxLength={14}
          placeholder="000.000.000-00"
          className="w-full bg-zinc-900 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
          Telefone <span className="text-white/20">(opcional)</span>
        </label>
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(11) 99999-9999"
          className="w-full bg-zinc-900 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          name="marketingConsent"
          type="checkbox"
          checked={formData.marketingConsent}
          onChange={handleChange}
          className="mt-0.5 accent-white"
        />
        <span className="text-[10px] text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
          Quero receber novidades e lançamentos da Street Stars
        </span>
      </label>

      {error && (
        <p className="text-red-400 text-xs uppercase tracking-wide font-mono">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-xs uppercase tracking-wide font-mono">
          Perfil atualizado com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2"
      >
        {loading
          ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          : 'Salvar Alterações'
        }
      </button>
    </form>
  )
}

// ─── Tab: Endereços ──────────────────────────────────────────────────────────

function AddressesTab({ user }) {
  const [addresses, setAddresses] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    label: '', cep: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '', isDefault: false
  })

  useState(() => {
    async function load() {
      try {
        const ref = collection(db, 'users', user.uid, 'addresses')
        const snap = await getDocs(ref)
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAddresses(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name === 'cep') {
      setForm(prev => ({ ...prev, cep: formatCEP(value) }))
      return
    }
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function fetchCEP(cep) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }))
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const ref = collection(db, 'users', user.uid, 'addresses')
      const docRef = await addDoc(ref, {
        ...form,
        cep: form.cep.replace(/\D/g, ''),
      })
      setAddresses(prev => [...prev, { id: docRef.id, ...form }])
      setShowForm(false)
      setForm({
        label: '', cep: '', street: '', number: '',
        complement: '', neighborhood: '', city: '', state: '', isDefault: false
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', id))
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      {addresses.map(address => (
        <div key={address.id} className="border border-white/10 bg-zinc-900/50 p-4 rounded-sm relative group">
          {address.isDefault && (
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono mb-2 block">
              Padrão
            </span>
          )}
          <p className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            {address.label}
          </p>
          <p className="text-xs text-white/50 font-mono leading-relaxed">
            {address.street}, {address.number}
            {address.complement && ` — ${address.complement}`}<br />
            {address.neighborhood} — {address.city}/{address.state}<br />
            CEP: {formatCEP(address.cep)}
          </p>
          <button
            onClick={() => handleDelete(address.id)}
            className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xs uppercase tracking-widest font-bold"
          >
            Remover
          </button>
        </div>
      ))}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="border border-dashed border-white/20 text-white/40 hover:border-white hover:text-white transition-all p-4 text-xs uppercase tracking-widest font-bold"
        >
          + Adicionar Endereço
        </button>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4 border border-white/10 bg-zinc-900/50 p-6 rounded-sm">
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono border-b border-white/5 pb-3">
            Novo Endereço
          </p>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
              Identificação
            </label>
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Ex: Casa, Trabalho"
              className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
              CEP
            </label>
            <input
              name="cep"
              value={form.cep}
              onChange={handleChange}
              onBlur={(e) => fetchCEP(e.target.value)}
              maxLength={9}
              placeholder="00000-000"
              className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                Rua
              </label>
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                Número
              </label>
              <input
                name="number"
                value={form.number}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
              Complemento <span className="text-white/20">(opcional)</span>
            </label>
            <input
              name="complement"
              value={form.complement}
              onChange={handleChange}
              placeholder="Apto, Bloco..."
              className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
              Bairro
            </label>
            <input
              name="neighborhood"
              value={form.neighborhood}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                Cidade
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                UF
              </label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                maxLength={2}
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono uppercase"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              name="isDefault"
              type="checkbox"
              checked={form.isDefault}
              onChange={handleChange}
              className="accent-white"
            />
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono group-hover:text-white/60 transition-colors">
              Definir como endereço padrão
            </span>
          </label>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-black font-black uppercase tracking-[0.2em] py-3 hover:bg-zinc-200 transition-all disabled:opacity-50 text-xs flex items-center justify-center"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                : 'Salvar'
              }
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 border border-white/20 text-white/50 hover:text-white hover:border-white transition-all text-xs uppercase tracking-widest font-bold"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Tab: Pedidos ────────────────────────────────────────────────────────────

function OrdersTab({ user }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      try {
        const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore/lite')
        const { db } = await import('../../services/firebase')

        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('created_at', 'desc')
        )
        const snap = await getDocs(q)
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setOrders(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [user.uid])

  if (loading) {
    return (
      <div className="text-white/30 text-xs font-mono uppercase tracking-widest animate-pulse py-10 text-center">
        Carregando pedidos...
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-sm">
        <p className="text-white/30 text-xs uppercase tracking-widest font-mono text-center">
          Você ainda não fez nenhum pedido.
        </p>
        <Link
          to="/"
          className="mt-4 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors underline"
        >
          Ir para a loja
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map(order => (
        <div key={order.id} className="border border-white/10 rounded-sm overflow-hidden">
          <div className="px-5 py-3 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[10px] font-mono text-white/20 mt-0.5">
                {order.created_at?.toDate
                  ? order.created_at.toDate().toLocaleDateString('pt-BR')
                  : '—'
                }
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">
                {order.address?.city}/{order.address?.state}
              </p>
              <p className="text-sm font-black text-white">
                {formatCurrency(order.total)}
              </p>
            </div>
            <Link
              to={`/pedido/${order.id}`}
              className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors font-mono border border-white/10 hover:border-white px-3 py-2"
            >
              Ver Detalhes
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function OrderStatusBadge({ status }) {
  const config = {
    pending:    { label: 'Aguardando Pagamento', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' },
    paid:       { label: 'Pago', color: 'text-green-400 border-green-400/30 bg-green-400/5' },
    processing: { label: 'Em Processamento', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
    shipped:    { label: 'Enviado', color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
    delivered:  { label: 'Entregue', color: 'text-white border-white/20 bg-white/5' },
    cancelled:  { label: 'Cancelado', color: 'text-red-400 border-red-400/30 bg-red-400/5' },
  }

  const { label, color } = config[status] || { label: status, color: 'text-white/40 border-white/10' }

  return (
    <span className={`text-[9px] uppercase tracking-widest font-bold font-mono px-2 py-1 border rounded-sm ${color}`}>
      {label}
    </span>
  )
}

// ─── Tab: Segurança ──────────────────────────────────────────────────────────

function SecurityTab({ user }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Senha atual incorreta.')
      } else {
        setError('Erro ao alterar senha. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
          Senha Atual
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full bg-zinc-900 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono"
          required
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
          Nova Senha
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          className="w-full bg-zinc-900 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
          required
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
          Confirmar Nova Senha
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full bg-zinc-900 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono"
          required
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs uppercase tracking-wide font-mono">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-xs uppercase tracking-wide font-mono">
          Senha alterada com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2"
      >
        {loading
          ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          : 'Alterar Senha'
        }
      </button>
    </form>
  )
}