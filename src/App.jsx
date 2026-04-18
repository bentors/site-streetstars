import { useState, lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { SpeedInsights } from "@vercel/speed-insights/react"

// Utils & Analytics
import { initGA, logPageView } from './utils/analytics'
import ScrollToTop from './utils/ScrollToTop'

// Layout & Loading
import Loading from './components/Loading'
import DefaultLayout from './components/layout/DefaultLayout'

// Páginas Estáticas
import Home from './pages/Home'



// Rotas de Segurança
const Private = lazy(() => import('./routes/Private'))
const PrivateUser = lazy(() => import('./routes/PrivateUser'))

// Lazy Loading - Páginas Públicas
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const LegalInfo = lazy(() => import('./pages/LegalInfo'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Lazy Loading - Auth
const UserLogin = lazy(() => import('./pages/auth/UserLogin'))
const UserRegister = lazy(() => import('./pages/auth/UserRegister'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))

// Lazy Loading - Área do Usuário
const MyAccount = lazy(() => import('./pages/account/MyAccount'))

// Lazy Loading - Checkout
const CheckoutAddress = lazy(() => import('./pages/checkout/CheckoutAddress'))
const CheckoutReview = lazy(() => import('./pages/checkout/CheckoutReview'))
const OrderConfirmation = lazy(() => import('./pages/checkout/OrderConfirmation'))

// Lazy Loading - Admin
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const NewProduct = lazy(() => import('./pages/admin/NewProduct'))
const EditProduct = lazy(() => import('./pages/admin/EditProduct'))

export default function App() {
  const [overlayActive, setOverlayActive] = useState(false)
  const location = useLocation()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      initGA();
    }, 3000);
    return () => clearTimeout(timer);
  }, [])

  useEffect(() => {
    logPageView()
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <ScrollToTop />

      <Suspense fallback={<Loading />}>
        <Routes location={location}>
          
          {/* Rotas Públicas com Layout */}
          <Route element={
            <DefaultLayout 
              overlayActive={overlayActive} 
              setOverlayActive={setOverlayActive} 
            />
          }>
            <Route index element={<Home />} />
            <Route path="product/:id" element={<ProductPage />} />
            <Route path="collection/:id" element={<CollectionPage />} />
            <Route path="legal/:slug" element={<LegalInfo />} />
          </Route>

          {/* Rotas de Autenticação */}
          <Route path="login" element={<UserLogin />} />
          <Route path="cadastro" element={<UserRegister />} />
          <Route path="esqueci-senha" element={<ForgotPassword />} />

          {/* Rotas de Checkout — requer login */}
          <Route path="checkout/endereco" element={<PrivateUser><CheckoutAddress /></PrivateUser>} />
          <Route path="checkout/revisao" element={<PrivateUser><CheckoutReview /></PrivateUser>} />
          <Route path="pedido/:orderId" element={<PrivateUser><OrderConfirmation /></PrivateUser>} />

          {/* Rotas Protegidas — Usuário */}
          <Route path="minha-conta" element={<PrivateUser><MyAccount /></PrivateUser>} />

          {/* Rotas Admin */}
          <Route path="admin" element={<Login />} />
          <Route path="admin/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="admin/new-product" element={<Private><NewProduct /></Private>} />
          <Route path="admin/edit-product/:id" element={<Private><EditProduct /></Private>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <SpeedInsights />
    </div>
  )
}