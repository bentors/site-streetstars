import { useState, lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { initGA, logPageView } from './utils/analytics'

const Overlay = lazy(() => import('./components/Overlay'))
import Header from './components/Header'
const CartDrawer = lazy(() => import('./components/CartDrawer'))
import ScrollToTop from './utils/ScrollToTop' 
import FloatingAction from './components/FloatingAction'
import Home from './pages/Home'

const ProductPage = lazy(() => import('./pages/ProductPage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Footer = lazy(() => import('./components/Footer'))
const LegalInfo = lazy(() => import('./pages/LegalInfo'))

const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
  </div>
)

export default function App() {
  const [overlayActive, setOverlayActive] = useState(false)
  const location = useLocation()
  
  useEffect(() => {
    initGA()
  }, [])

  useEffect(() => {
    logPageView()
  }, [location])

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">

      <ScrollToTop />
      <Suspense fallback={null}>
        <Overlay active={overlayActive} onClick={() => setOverlayActive(false)} />
      </Suspense>

      <Header setOverlayActive={setOverlayActive} />
      
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      
      <Suspense fallback={<PageLoader />}>

          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/collection/:id" element={<CollectionPage />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/legal/:slug" element={<LegalInfo />} />
          </Routes>
      </Suspense>

      <FloatingAction setOverlayActive={setOverlayActive} />
      <Suspense fallback={<div className="h-20 bg-black" />}>
        <Footer />
      </Suspense>
    </div>
  )
}