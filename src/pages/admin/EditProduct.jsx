import { Link, useParams } from 'react-router-dom'
import ProductForm from '../../components/admin/ProductForm'
import Logo from '../../components/ui/Logo'

export default function EditProduct() {
  const { id } = useParams()
  
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard">
                        <Logo className="h-6 w-auto text-white" />
                    </Link>
                    <span className="text-white/30">/</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/80 font-mono">
                        Editar Produto
                    </span>
                </div>
                
                <Link to="/admin/dashboard" className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                    Voltar
                </Link>
            </div>
        </header>

        <main className="p-6 pb-20">
            <ProductForm productId={id} />
        </main>
    </div>
  )
}