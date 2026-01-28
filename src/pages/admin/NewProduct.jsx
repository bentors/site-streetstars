import { Link } from 'react-router-dom'
import ProductForm from '../../components/admin/ProductForm'

export default function NewProduct() {
  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
       <Link to="/admin/dashboard" className="text-white/50 hover:text-white mb-4 block">← Voltar</Link>
       <ProductForm />
    </div>
  )
}