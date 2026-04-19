import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, getDocs, addDoc } from 'firebase/firestore/lite'
import { motion } from 'framer-motion'
import { db } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import Logo from '../../components/ui/Logo'
import { formatCEP } from '../../utils/validators'
import { calculateShipping } from '../../services/api'

export default function CheckoutAddress() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cartItems } = useCart()

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [saving, setSaving] = useState(false)

  const [shippingOptions, setShippingOptions] = useState([])
  const [selectedShipping, setSelectedShipping] = useState(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [shippingError, setShippingError] = useState(null)

  const [form, setForm] = useState({
    label: '', cep: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '', isDefault: false
  })

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/', { replace: true })
    }
  }, [cartItems, navigate])

  useEffect(() => {
    async function loadAddresses() {
        try {
        const ref = collection(db, 'users', user.uid, 'addresses')
        const snap = await getDocs(ref)
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAddresses(list)

        const defaultAddress = list.find(a => a.isDefault)
        const first = defaultAddress || (list.length > 0 ? list[0] : null)

        if (first) {
            setSelectedAddressId(first.id)
            handleCalculateShipping(first.cep)
        } else {
            setShowNewForm(true)
        }
        } catch (err) {
        console.error(err)
        } finally {
        setLoadingAddresses(false)
        }
    }
    loadAddresses()
  }, [user.uid])

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

  async function handleSaveAddress(e) {
    e.preventDefault()
    setSaving(true)
    try {
        const ref = collection(db, 'users', user.uid, 'addresses')
        const docRef = await addDoc(ref, {
        ...form,
        cep: form.cep.replace(/\D/g, ''),
        })
        const newAddress = { id: docRef.id, ...form }
        setAddresses(prev => [...prev, newAddress])
        setSelectedAddressId(docRef.id)
        setShowNewForm(false)
        setForm({
        label: '', cep: '', street: '', number: '',
        complement: '', neighborhood: '', city: '', state: '', isDefault: false
        })
        handleCalculateShipping(form.cep)
    } catch (err) {
        console.error(err)
    } finally {
        setSaving(false)
    }
  }

  async function handleCalculateShipping(cep) {
    setLoadingShipping(true)
    setShippingError(null)
    setShippingOptions([])
    setSelectedShipping(null)

    try {
        const { options } = await calculateShipping(cep)
        if (options.length === 0) {
        setShippingError('Nenhuma opção de frete disponível para este CEP.')
        return
        }
        setShippingOptions(options)
        setSelectedShipping(options[0])
    } catch (err) {
        console.error(err)
        setShippingError('Erro ao calcular frete. Tente novamente.')
    } finally {
        setLoadingShipping(false)
    }
 }

  function handleContinue() {
    const selected = addresses.find(a => a.id === selectedAddressId)
    if (!selected || !selectedShipping) return
    navigate('/checkout/revisao', {
        state: {
        address: selected,
        shipping: selectedShipping
        }
    })
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">

      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo className="h-6 w-auto text-white" />
          </Link>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-mono">
            <span className="text-white font-bold">1. Endereço</span>
            <span className="text-white/20">—</span>
            <span className="text-white/30">2. Revisão</span>
            <span className="text-white/20">—</span>
            <span className="text-white/30">3. Pagamento</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-8">
          Endereço de Entrega
        </h1>

        {loadingAddresses ? (
          <div className="text-white/40 text-xs font-mono uppercase tracking-widest animate-pulse py-10 text-center">
            Carregando endereços...
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Endereços salvos */}
            {addresses.map(address => (
              <button
                key={address.id}
                onClick={() => { setSelectedAddressId(address.id); setShowNewForm(false); handleCalculateShipping(address.cep) }}
                className={`w-full text-left border p-4 transition-all rounded-sm ${
                  selectedAddressId === address.id
                    ? 'border-white bg-white/5'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white mb-1">
                      {address.label}
                    </p>
                    <p className="text-xs text-white/50 font-mono leading-relaxed">
                      {address.street}, {address.number}
                      {address.complement && ` — ${address.complement}`}<br />
                      {address.neighborhood} — {address.city}/{address.state}<br />
                      CEP: {formatCEP(address.cep)}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 transition-all ${
                    selectedAddressId === address.id
                      ? 'border-white bg-white'
                      : 'border-white/30'
                  }`} />
                </div>
              </button>
            ))}

            {/* Botão novo endereço */}
            {!showNewForm && (
              <button
                onClick={() => { setShowNewForm(true); setSelectedAddressId(null) }}
                className="border border-dashed border-white/20 text-white/40 hover:border-white hover:text-white transition-all p-4 text-xs uppercase tracking-widest font-bold rounded-sm"
              >
                + Usar novo endereço
              </button>
            )}

            {/* Formulário novo endereço */}
            {showNewForm && (
              <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveAddress}
                className="flex flex-col gap-4 border border-white/10 bg-zinc-900/50 p-6 rounded-sm"
              >
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
                    Salvar como endereço padrão
                  </span>
                </label>

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-white text-black font-black uppercase tracking-[0.2em] py-3 hover:bg-zinc-200 transition-all disabled:opacity-50 text-xs flex items-center justify-center"
                  >
                    {saving
                      ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      : 'Salvar e Usar'
                    }
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setShowNewForm(false); setSelectedAddressId(addresses[0].id) }}
                      className="px-6 border border-white/20 text-white/50 hover:text-white hover:border-white transition-all text-xs uppercase tracking-widest font-bold"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </motion.form>
            )}

            {/* Opções de frete */}
            {selectedAddressId && !showNewForm && (
            <div className="border border-white/10 rounded-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/50">
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                    Opções de Frete
                </p>
                </div>

                {loadingShipping ? (
                <div className="px-5 py-4 text-[10px] font-mono text-white/30 uppercase tracking-widest animate-pulse">
                    Calculando frete...
                </div>
                ) : shippingError ? (
                <div className="px-5 py-4 text-[10px] font-mono text-red-400 uppercase tracking-wider">
                    {shippingError}
                </div>
                ) : (
                <div className="divide-y divide-white/5">
                    {shippingOptions.map(option => (
                    <button
                        type="button"
                        key={option.id}
                        onClick={() => setSelectedShipping(option)}
                        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                        selectedShipping?.id === Number(option.id)
                            ? 'bg-white/5'
                            : 'hover:bg-white/3'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                            selectedShipping?.id === Number(option.id)
                            ? 'border-white bg-white'
                            : 'border-white/30'
                        }`} />
                        <div className="text-left">
                            <p className="text-xs font-bold text-white uppercase tracking-wider">
                            {option.name}
                            </p>
                            <p className="text-[10px] text-white/40 font-mono mt-0.5">
                            {option.company} · {option.delivery_time} dias úteis
                            </p>
                        </div>
                        </div>
                        <p className="text-sm font-mono font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        }).format(option.price)}
                        </p>
                    </button>
                    ))}
                </div>
                )}
            </div>
          )}

            {/* Botão continuar */}
            {selectedAddress && !showNewForm && selectedShipping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <button
                  onClick={handleContinue}
                  className="group relative w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] overflow-hidden text-xs flex items-center justify-center gap-2"
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                    Continuar para Revisão
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                </button>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}