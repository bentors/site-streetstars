import { useState, lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

// 1. Utils & Analytics
import { initGA, logPageView } from './utils/analytics'
import ScrollToTop from './utils/ScrollToTop'

// 2. Componentes de UI e Layout
import Loading from './components/Loading'
import DefaultLayout from './layouts/DefaultLayout'

// 3. Páginas Estáticas (Home carrega direto)
import Home from './pages/Home'

// 4. Rotas de Segurança
import Private from './routes/Private'

// 5. Lazy Loading (Páginas Públicas)
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const LegalInfo = lazy(() => import('./pages/LegalInfo'))
const NotFound = lazy(() => import('./pages/NotFound'))

// 6. Lazy Loading (Área Administrativa)
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const NewProduct = lazy(() => import('./pages/admin/NewProduct'))
const EditProduct = lazy(() => import('./pages/admin/EditProduct'))

export default function App() {
  const [overlayActive, setOverlayActive] = useState(false)
  const location = useLocation()
  
  // Analytics
  useEffect(() => { initGA() }, [])
  useEffect(() => { logPageView() }, [location])

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <ScrollToTop />

      <Suspense fallback={<Loading />}>
        <Routes location={location} key={location.pathname}>
          
          {/* GRUPO 1: Rotas com Header, Footer e Carrinho */}
          <Route element={
            <DefaultLayout 
              overlayActive={overlayActive} 
              setOverlayActive={setOverlayActive} 
            />
          }>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/collection/:id" element={<CollectionPage />} />
            <Route path="/legal/:slug" element={<LegalInfo />} />
          </Route>

          {/* GRUPO 2: Rotas Limpas (Admin e Login) */}
          <Route path="/admin" element={<Login />} />
          <Route path="/admin/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="/admin/new-product" element={<Private><NewProduct /></Private>} />
          <Route path="/admin/edit-product/:id" element={<Private><EditProduct/></Private>} />

          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}