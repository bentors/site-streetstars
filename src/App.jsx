import { useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

import Overlay from './components/Overlay'
import Header from './components/Header'
import CartDrawer from './components/CartDrawer' 
import ScrollToTop from './utils/ScrollToTop' 
import FloatingAction from './components/FloatingAction'
import Home from './pages/Home'

const ProductPage = lazy(() => import('./pages/ProductPage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Footer = lazy(() => import('./components/Footer'))

const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
  </div>
)

export default function App() {
  const [overlayActive, setOverlayActive] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">

      <ScrollToTop />
      <Overlay active={overlayActive} onClick={() => setOverlayActive(false)} />
      <Header setOverlayActive={setOverlayActive} />
      <CartDrawer />
      
      <Suspense fallback={<PageLoader />}>

          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/collection/:id" element={<CollectionPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
      </Suspense>

      <FloatingAction setOverlayActive={setOverlayActive} />
      <Suspense fallback={<div className="h-20 bg-black" />}>
        <Footer />
      </Suspense>
    </div>
  )
}