import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth, db } from '../../services/firebase'
import { Link, useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

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
          list.push({
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price,
            img: doc.data().img,
            category: doc.data().category
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

        <div className="bg-zinc-900 border border-white/10 p-6 rounded-sm mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h2 className="text-xl font-bold">Gerenciar Estoque</h2>
                <p className="text-white/50 text-sm">Você tem {products.length} produtos cadastrados.</p>
            </div>
            
            <Link 
              to="/admin/new-product"
              className="bg-white text-black font-bold uppercase tracking-widest px-6 py-3 text-xs hover:bg-zinc-200 transition-colors"
            >
              + Novo Produto
            </Link>
        </div>

        {loading ? (
            <div className="text-center text-white/50 py-10">Carregando estoque...</div>
        ) : products.length === 0 ? (
            <div className="text-center text-white/50 py-10 border border-dashed border-white/10 rounded">
                Nenhum produto encontrado. Cadastre o primeiro!
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/70">
                    <thead className="bg-zinc-900 text-white uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="p-4 rounded-tl-lg">Item</th>
                            <th className="p-4">Categoria</th>
                            <th className="p-4">Preço</th>
                            <th className="p-4 text-right rounded-tr-lg">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {products.map((item) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-14 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                            <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-bold text-white">{item.name}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-white/10 px-2 py-1 rounded text-[10px] uppercase tracking-widest">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="p-4 font-mono">
                                    R$ {item.price.toFixed(2)}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link 
                                            to={`/admin/edit-product/${item.id}`}
                                            className="text-blue-400 hover:text-blue-300 font-bold text-[10px] uppercase tracking-widest"
                                        >
                                            Editar
                                        </Link>

                                        <button 
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="text-red-500 hover:text-red-400 font-bold text-[10px] uppercase tracking-widest"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  )
}