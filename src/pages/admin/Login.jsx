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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        <Link to="/" className="mb-10 hover:opacity-80 transition-opacity">
          <Logo className="h-16 w-auto text-white" />
        </Link>

        <div className="w-full bg-zinc-900/80 border border-white/10 p-8 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
             <h1 className="text-xl font-bold uppercase tracking-widest text-white">
               Acesso Restrito
             </h1>
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">ID de Usuário / Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-700"
                placeholder="admin@streetstars.com"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">Chave de Acesso</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 text-white p-3 text-sm focus:border-white outline-none transition-colors font-mono placeholder:text-zinc-700"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-white text-black font-black uppercase tracking-[0.2em] py-4 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              {loading ? 'Autenticando...' : 'Iniciar Sessão'}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-8 text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors">
          ← Retornar ao Site
        </Link>
      </div>
    </div>
  )
}