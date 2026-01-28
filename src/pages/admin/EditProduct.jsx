import { Link, useParams } from 'react-router-dom'
import ProductForm from '../../components/admin/ProductForm'

export default function EditProduct() {
  const { id } = useParams()
  
  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
       <Link to="/admin/dashboard" className="text-white/50 hover:text-white mb-4 block">← Voltar</Link>
       <ProductForm productId={id} />
    </div>
  )
}