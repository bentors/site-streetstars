import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore/lite'
import { motion } from 'framer-motion'
import { auth, db } from '../../services/firebase'
import Logo from '../../components/ui/Logo'
// Alteração: validateCPF e formatCPF removidos dos imports
import { validateEmail, validatePassword, passwordStrength } from '../../utils/validators'

const STRENGTH_CONFIG = {
  fraca:  { color: 'bg-red-500',   label: 'Fraca',  width: 'w-1/3' },
  média:  { color: 'bg-yellow-400', label: 'Média',  width: 'w-2/3' },
  forte:  { color: 'bg-green-500',  label: 'Forte',  width: 'w-full' },
}

export default function UserRegister() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    marketingConsent: false,
  })

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [pwStrength, setPwStrength] = useState(null)

  function handleChange(e) {
    const { name, value, type, checked } = e.target

    if (name === 'password') {
      setPwStrength(value ? passwordStrength(value) : null)
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function validate() {
    if (!formData.name.trim()) return 'Informe seu nome completo.'
    if (!validateEmail(formData.email)) return 'E-mail inválido.'

    const { valid, error: pwError } = validatePassword(formData.password)
    if (!valid) return pwError

    if (formData.password !== formData.confirmPassword) return 'As senhas não coincidem.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      await setDoc(doc(db, 'users', user.uid), {
        name:                formData.name.trim(),
        email:               formData.email,
        phone:               formData.phone.trim(),
        marketingConsent:    formData.marketingConsent,
        marketingConsentDate: serverTimestamp(),
        created_at:          serverTimestamp(),
      })

      navigate('/', { replace: true })

    } catch (err) {
      console.error(err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.')
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use ao menos 8 caracteres com letras e números.')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = pwStrength ? STRENGTH_CONFIG[pwStrength] : null

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden selection:bg-white selection:text-black">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
      >
        <Link to="/" className="mb-10 hover:opacity-80 transition-opacity">
          <Logo className="h-12 md:h-16 w-auto text-white" />
        </Link>

        <div className="w-full bg-zinc-900/80 border border-white/10 p-8 backdrop-blur-md shadow-2xl rounded-sm">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h1 className="text-sm font-bold uppercase tracking-widest text-white">
              Criar Conta
            </h1>
            <span className="text-[9px] uppercase text-white/30 tracking-widest font-mono">
              Novo acesso
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 text-center uppercase tracking-wide font-medium"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                Nome Completo
              </label>
              <input
                name="name" type="text" value={formData.name}
                onChange={handleChange} autoComplete="name"
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
                placeholder="Seu nome" required
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                E-mail
              </label>
              <input
                name="email" type="email" value={formData.email}
                onChange={handleChange} autoComplete="email"
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
                placeholder="seu@email.com" required
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                Telefone
              </label>
              <input
                name="phone" type="tel" value={formData.phone}
                onChange={handleChange} autoComplete="tel"
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                Senha
              </label>
              <input
                name="password" type="password" value={formData.password}
                onChange={handleChange} autoComplete="new-password"
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
                placeholder="Mínimo 8 caracteres"
                required
              />
              {strength && (
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-[10px] text-white/30 mt-1 font-mono">
                    Força: <span className="text-white/60">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                Confirmar Senha
              </label>
              <input
                name="confirmPassword" type="password" value={formData.confirmPassword}
                onChange={handleChange} autoComplete="new-password"
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
                placeholder="Repita a senha"
                required
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mt-1">
              <input
                name="marketingConsent" type="checkbox"
                checked={formData.marketingConsent}
                onChange={handleChange}
                className="mt-0.5 accent-white"
              />
              <span className="text-[10px] text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                Quero receber novidades e lançamentos da Street Stars
              </span>
            </label>

            <p className="text-[10px] text-white/25 leading-relaxed">
              Ao criar sua conta, você concorda com nossa{' '}
              <Link to="/legal/privacidade" className="text-white/50 underline hover:text-white transition-colors">
                Política de Privacidade
              </Link>
              {' '}e{' '}
              <Link to="/legal/termos" className="text-white/50 underline hover:text-white transition-colors">
                Termos de Uso
              </Link>.
            </p>

            <button
              type="submit" disabled={loading}
              className="mt-2 w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Criar Conta</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-white/30">
          Já tem conta?{' '}
          <Link to="/login" className="text-white/60 hover:text-white transition-colors">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}