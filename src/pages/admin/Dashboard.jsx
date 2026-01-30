import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth, db } from '../../services/firebase'
import { Link, useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { formatCurrency } from '../../utils/format'
import Logo from '../../components/ui/Logo'

export default function Dashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      const productsRef = collection(db, "products")
      
      try {
        const snapshot = await getDocs(productsRef)
        let list = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          list.push({
            id: doc.id,
            name: data.name,
            price: data.price,
            img: data.img,
            category: data.category,
            isActive: data.isActive ?? true, 
            isFeatured: data.isFeatured ?? false
          })
        })

        setProducts(list)
      } catch(err){
        console.log(err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin')
  }

  async function handleDelete(id, name) {
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o produto: ${name}?`)
    
    if(confirmDelete) {
      try {
        await deleteDoc(doc(db, "products", id))
        setProducts(products.filter(item => item.id !== id))
        alert("Produto deletado com sucesso!")
      } catch(err) {
        console.log(err)
        alert("Erro ao deletar.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to="/admin/dashboard">
                    <Logo className="h-6 w-auto text-white" />
                </Link>
                <div className="h-4 w-px bg-white/20"></div>
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                    System v1.0
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

      <main className="p-6 md:p-10 max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-6">
            <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Dashboard</h1>
                <p className="text-white/50 text-xs font-mono">
                    GERENCIAMENTO DE ESTOQUE • {products.length} ITENS CADASTRADOS
                </p>
            </div>

            <Link 
                to="/admin/new-product"
                className="bg-white text-black font-black uppercase tracking-widest px-6 py-4 text-xs hover:bg-zinc-200 transition-colors flex items-center gap-2"
            >
                <span>+ Novo Produto</span>
            </Link>
        </div>

        {loading ? (
            <div className="text-center text-white/50 py-20 font-mono text-sm animate-pulse">
                CARREGANDO DADOS DO SISTEMA...
            </div>
        ) : products.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded bg-zinc-900/30">
                <p className="text-white/50 mb-4">Nenhum produto no inventário.</p>
                <Link to="/admin/new-product" className="text-white underline">Cadastrar primeiro item</Link>
            </div>
        ) : (
            <div className="border border-white/10 rounded-sm overflow-hidden bg-zinc-900/30">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900 text-white/40 uppercase tracking-widest text-[9px] font-bold border-b border-white/5">
                            <tr>
                                <th className="p-4 pl-6">Produto / Status</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4 font-mono">Valor (BRL)</th>
                                <th className="p-4 text-right pr-6">Controles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-10 h-10 bg-zinc-800 rounded-sm overflow-hidden border border-white/10">
                                                <img 
                                                    src={item.img} 
                                                    alt={item.name} 
                                                    className={`w-full h-full object-cover transition-all ${!item.isActive ? 'grayscale opacity-50' : ''}`} 
                                                />
                                                {item.isFeatured && (
                                                    <div className="absolute top-0 right-0 bg-yellow-500 text-[6px] p-0.5 shadow-sm z-10" title="Destaque">
                                                        ⭐
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <span className={`font-bold text-sm block transition-colors ${!item.isActive ? 'text-white/50 line-through' : 'text-white group-hover:text-white/90'}`}>
                                                    {item.name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-zinc-600'}`}></span>
                                                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono">
                                                        {item.isActive ? 'Ativo' : 'Rascunho'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="border border-white/20 text-white/70 px-2 py-1 rounded text-[9px] uppercase tracking-wider font-mono">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-mono text-white/70">
                                        {formatCurrency(item.price)}
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Link 
                                                to={`/admin/edit-product/${item.id}`}
                                                className="text-white hover:text-blue-400"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                </svg>
                                            </Link>

                                            <button 
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="text-white hover:text-red-500 transition-colors"
                                                title="Excluir"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </main>
    </div>
  )
}