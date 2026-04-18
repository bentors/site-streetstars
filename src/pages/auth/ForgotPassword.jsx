import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { motion } from 'framer-motion'
import { auth } from '../../services/firebase'
import Logo from '../../components/ui/Logo'
import { validateEmail } from '../../utils/validators'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!validateEmail(email)) {
      setError('Informe um e-mail válido.')
      return
    }

    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSent(true)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/user-not-found') {
        // Mensagem intencional — não confirmar se o e-mail existe por segurança
        setSent(true)
      } else {
        setError('Erro ao enviar o e-mail. Tente novamente.')
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
            <h1 className="text-sm font-bold uppercase tracking-widest text-white">
              Recuperar Senha
            </h1>
            <span className="text-[9px] uppercase text-white/30 tracking-widest font-mono">
              Acesso
            </span>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-white/60 text-center leading-relaxed uppercase tracking-widest font-mono">
                Se este e-mail estiver cadastrado, você receberá as instruções em instantes.
              </p>
              <Link
                to="/login"
                className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
              >
                Voltar ao Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <p className="text-[10px] text-white/40 leading-relaxed font-mono uppercase tracking-wide">
                Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
              </p>

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
                  required
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
                    <span>Enviar Instruções</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <Link to="/login" className="mt-8 text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors flex items-center gap-2 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Login
        </Link>
      </motion.div>
    </div>
  )
}