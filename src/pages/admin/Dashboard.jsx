import { useState, useEffect, useRef, useCallback } from 'react'
import { signOut } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import {
  collection, getDocs, deleteDoc, doc,
  query, orderBy, limit, startAfter
} from 'firebase/firestore/lite'
import {
  collection as col, query as q,
  orderBy as ob, limit as lim, onSnapshot
} from 'firebase/firestore'
import { db, dbRealtime, auth } from '../../services/firebase'
import { formatCurrency } from '../../utils/format'
import Logo from '../../components/ui/Logo'

const TABS = [
  { id: 'products', label: 'Produtos' },
  { id: 'orders',   label: 'Pedidos'  },
]

const ORDER_STATUS_CONFIG = {
  pending:    { label: 'Aguardando Pagamento', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' },
  paid:       { label: 'Pago',                 color: 'text-green-400 border-green-400/30 bg-green-400/5'   },
  processing: { label: 'Em Processamento',     color: 'text-blue-400 border-blue-400/30 bg-blue-400/5'     },
  shipped:    { label: 'Enviado',              color: 'text-purple-400 border-purple-400/30 bg-purple-400/5'},
  delivered:  { label: 'Entregue',             color: 'text-white border-white/20 bg-white/5'              },
  cancelled:  { label: 'Cancelado',            color: 'text-red-400 border-red-400/30 bg-red-400/5'        },
}

const LAST_SEEN_KEY   = 'admin_orders_last_seen'
const PRODUCTS_PER_PAGE = 20
const ORDERS_PER_PAGE   = 30

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('products')

  // ── Produtos ───────────────────────────────────────────────────────────────
  const [products, setProducts]               = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [lastProductDoc, setLastProductDoc]   = useState(null)
  const [hasMoreProducts, setHasMoreProducts] = useState(false)
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false)

  // ── Pedidos ────────────────────────────────────────────────────────────────
  const [orders, setOrders]           = useState([])
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const lastSeenRef = useRef(parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0'))

  // ── Feedback inline (substitui alert/confirm) ──────────────────────────────
  const [toast, setToast]             = useState(null) // { type: 'success'|'error', msg }
  const [confirmDialog, setConfirmDialog] = useState(null) // { id, name, resolve }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Carregar página inicial de produtos ────────────────────────────────────
  useEffect(() => {
    async function loadProducts() {
      try {
        const snap = await getDocs(
          query(collection(db, 'products'), orderBy('name'), limit(PRODUCTS_PER_PAGE + 1))
        )
        const docs  = snap.docs.slice(0, PRODUCTS_PER_PAGE)
        const more  = snap.docs.length > PRODUCTS_PER_PAGE

        setProducts(docs.map(d => ({ id: d.id, ...d.data() })))
        setLastProductDoc(docs[docs.length - 1] ?? null)
        setHasMoreProducts(more)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProducts(false)
      }
    }
    loadProducts()
  }, [])

  // ── Carregar próxima página de produtos ────────────────────────────────────
  const loadMoreProducts = useCallback(async () => {
    if (!lastProductDoc || loadingMoreProducts) return
    setLoadingMoreProducts(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'products'),
          orderBy('name'),
          startAfter(lastProductDoc),
          limit(PRODUCTS_PER_PAGE + 1)
        )
      )
      const docs = snap.docs.slice(0, PRODUCTS_PER_PAGE)
      const more = snap.docs.length > PRODUCTS_PER_PAGE

      setProducts(prev => [...prev, ...docs.map(d => ({ id: d.id, ...d.data() }))])
      setLastProductDoc(docs[docs.length - 1] ?? null)
      setHasMoreProducts(more)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMoreProducts(false)
    }
  }, [lastProductDoc, loadingMoreProducts])

  // ── Listener em tempo real — apenas os 30 pedidos mais recentes ────────────
  useEffect(() => {
    const ordersQuery = q(
      col(dbRealtime, 'orders'),
      ob('created_at', 'desc'),
      lim(ORDERS_PER_PAGE)
    )

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setOrders(list)

      const newCount = list.filter(order => {
        const createdAt = order.created_at?.toMillis?.() || 0
        return createdAt > lastSeenRef.current && order.status === 'paid'
      }).length
      setNewOrdersCount(newCount)
    })

    return () => unsubscribe()
  }, [])

  function handleOrdersTabClick() {
    setActiveTab('orders')
    const now = Date.now()
    localStorage.setItem(LAST_SEEN_KEY, String(now))
    lastSeenRef.current = now
    setNewOrdersCount(0)
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin')
  }

  // ── Delete com confirmação inline ──────────────────────────────────────────
  function handleDelete(id, name) {
    setConfirmDialog({
      id,
      name,
      resolve: async (confirmed) => {
        setConfirmDialog(null)
        if (!confirmed) return
        try {
          await deleteDoc(doc(db, 'products', id))
          setProducts(prev => prev.filter(item => item.id !== id))
          showToast('success', 'Produto removido com sucesso.')
        } catch (err) {
          console.error(err)
          showToast('error', 'Erro ao deletar o produto.')
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 text-xs font-mono uppercase tracking-widest rounded-sm shadow-lg border transition-all ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Dialog de confirmação */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 p-8 max-w-sm w-full mx-4">
            <p className="text-sm font-mono text-white/80 mb-2">Confirmar exclusão</p>
            <p className="text-white font-bold mb-6">
              Deseja remover <span className="text-red-400">{confirmDialog.name}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => confirmDialog.resolve(false)}
                className="px-4 py-2 text-[10px] uppercase tracking-widest border border-white/20 text-white/60 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDialog.resolve(true)}
                className="px-4 py-2 text-[10px] uppercase tracking-widest bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Logo className="h-6 w-auto text-white" />
            </Link>
            <div className="h-4 w-px bg-white/20" />
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

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Dashboard</h1>
            <p className="text-white/50 text-xs font-mono">
              {activeTab === 'products'
                ? `GERENCIAMENTO DE ESTOQUE • ${products.length} ITENS CARREGADOS`
                : `PEDIDOS • ÚLTIMOS ${orders.length} REGISTROS`
              }
            </p>
          </div>
          {activeTab === 'products' && (
            <Link
              to="/admin/new-product"
              className="bg-white text-black font-black uppercase tracking-widest px-6 py-4 text-xs hover:bg-zinc-200 transition-colors flex items-center gap-2"
            >
              <span>+ Novo Produto</span>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={tab.id === 'orders' ? handleOrdersTabClick : () => setActiveTab(tab.id)}
              className={`pb-3 text-[11px] uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {tab.label}
              {tab.id === 'orders' && newOrdersCount > 0 && (
                <span className="bg-green-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {newOrdersCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Produtos */}
        {activeTab === 'products' && (
          <>
            {loadingProducts ? (
              <div className="text-center text-white/50 py-20 font-mono text-sm animate-pulse">
                CARREGANDO DADOS DO SISTEMA...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded bg-zinc-900/30">
                <p className="text-white/50 mb-4">Nenhum produto no inventário.</p>
                <Link to="/admin/new-product" className="text-white underline">
                  Cadastrar primeiro item
                </Link>
              </div>
            ) : (
              <>
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
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-zinc-600'}`} />
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

                {/* Carregar mais produtos */}
                {hasMoreProducts && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={loadMoreProducts}
                      disabled={loadingMoreProducts}
                      className="px-8 py-3 border border-white/20 text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white hover:border-white/50 transition-colors disabled:opacity-30"
                    >
                      {loadingMoreProducts ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Pedidos */}
        {activeTab === 'orders' && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded bg-zinc-900/30">
                <p className="text-white/50 font-mono text-sm">Nenhum pedido registrado ainda.</p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-sm overflow-hidden bg-zinc-900/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-900 text-white/40 uppercase tracking-widest text-[9px] font-bold border-b border-white/5">
                      <tr>
                        <th className="p-4 pl-6">Pedido</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Destino</th>
                        <th className="p-4 font-mono">Total</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map(order => {
                        const { label, color } = ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: 'text-white/40 border-white/10' }
                        const isNew = (order.created_at?.toMillis?.() || 0) > lastSeenRef.current
                          && order.status === 'paid'
                        return (
                          <tr key={order.id} className={`hover:bg-white/5 transition-colors group ${isNew ? 'bg-green-500/5' : ''}`}>
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-2">
                                {isNew && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e] flex-shrink-0" />
                                )}
                                <div>
                                  <p className="text-xs font-mono font-bold text-white">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                  </p>
                                  <p className="text-[10px] font-mono text-white/30 mt-0.5">
                                    {order.created_at?.toDate
                                      ? order.created_at.toDate().toLocaleDateString('pt-BR')
                                      : '—'
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-xs font-mono text-white/60 truncate max-w-[160px]">
                                {order.userId.slice(0, 12)}...
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="text-xs font-mono text-white/60">
                                {order.address?.city}/{order.address?.state}
                              </p>
                            </td>
                            <td className="p-4 font-mono text-sm text-white/70">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="p-4">
                              <span className={`text-[9px] uppercase tracking-widest font-bold font-mono px-2 py-1 border rounded-sm ${color}`}>
                                {label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}