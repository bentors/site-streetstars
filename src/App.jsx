import { useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Overlay from './components/Overlay'
import Header from './components/Header'
import FloatingAction from './components/FloatingAction'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ScrollToTop from './utils/ScrollToTop'

import Home from './pages/Home'
import ProductPage from './pages/ProductPage'
import CollectionPage from './pages/CollectionPage'

export default function App() {
  const [overlayActive, setOverlayActive] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">

      <ScrollToTop />
      <Overlay active={overlayActive} onClick={() => setOverlayActive(false)} />
      <Header setOverlayActive={setOverlayActive} />
      <CartDrawer />
      
      <AnimatePresence mode='wait'>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/collection/:id" element={<CollectionPage />} />
        </Routes>
      </AnimatePresence>

      <FloatingAction setOverlayActive={setOverlayActive} />
      <Footer />
    </div>
  )
}