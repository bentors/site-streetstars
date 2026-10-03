import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { motion } from 'framer-motion'
import { auth } from '../../services/firebase'
import Logo from '../../components/ui/Logo'

export default function UserLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate(from, { replace: true })
    })
    return () => unsubscribe()
  }, [navigate, from])

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('E-mail ou senha incorretos.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.')
      } else {
        setError('Erro ao acessar. Verifique seus dados.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden selection:bg-white selection:text-black">
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
            <h1 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Entrar
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase text-white/30 tracking-widest font-mono">Minha Conta</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">

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
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Senha
                </label>
                <Link
                  to="/esqueci-senha"
                  className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors font-mono"
                >
                  Esqueci a senha
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-800"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-white/30">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-white/60 hover:text-white transition-colors">
            Criar Conta
          </Link>
        </p>

        <Link to="/" className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors flex items-center gap-2 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Site
        </Link>
      </motion.div>
    </div>
  )
}