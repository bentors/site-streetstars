import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebaseConnection'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-4">
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">
            Dashboard
          </h1>
          <button 
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-red-500 hover:text-red-400 font-bold border border-red-500/30 px-4 py-2 hover:bg-red-500/10 transition-colors"
          >
            Sair
          </button>
        </div>

        <div className="grid gap-8">

          <div className="bg-zinc-900 border border-white/10 p-8 rounded-sm">
            <h2 className="text-xl font-bold mb-2">Gerenciar Loja</h2>
            <p className="text-white/50 mb-6 text-sm">Adicione novos produtos ou edite os existentes.</p>
            
            <Link 
              to="/admin/new-product"
              className="inline-flex items-center justify-center bg-white text-black font-bold uppercase tracking-widest px-6 py-3 text-xs hover:bg-zinc-200 transition-colors w-full sm:w-auto"
            >
              + Novo Produto
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}