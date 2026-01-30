import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/firebase'
import Logo from '../../components/ui/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    
    if(!email || !password) {
      alert("Preencha todos os campos")
      return
    }

    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin/dashboard')
    } catch(error) {
      console.log(error)
      alert("Erro ao logar. Verifique seus dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <Link to="/" className="mb-8">
        <Logo className="h-16 w-auto text-white mb-6" />
      </Link>

      <div className="w-full max-w-sm bg-zinc-900/50 border border-white/10 p-8 rounded-sm backdrop-blur-sm">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-6 text-center">
          Admin Acess
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">E-mail</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors"
              placeholder="admin@streetstars.com"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 mb-1 block">Senha</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-white text-black font-bold uppercase tracking-[0.2em] py-3 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>

        <Link to="/" className="block mt-6 text-center text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors">
          ← Voltar ao site
        </Link>
      </div>
    </div>
  )
}