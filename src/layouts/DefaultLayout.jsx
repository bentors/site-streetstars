import { Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'

import Header from '../components/layout/Header'
import FloatingAction from '../components/layout/FloatingAction'

const Footer = lazy(() => import('../components/layout/Footer'))
const CartDrawer = lazy(() => import('../components/layout/CartDrawer'))
const Overlay = lazy(() => import('../components/layout/Overlay'))

export default function DefaultLayout({ setOverlayActive, overlayActive }) {
  return (
    <>
      <Suspense fallback={null}>
        <Overlay active={overlayActive} onClick={() => setOverlayActive(false)} />
        <CartDrawer />
      </Suspense>

      <Header setOverlayActive={setOverlayActive} />
      
      <main>
        <Outlet /> 
      </main>

      <FloatingAction setOverlayActive={setOverlayActive} />
      
      <Suspense fallback={<div className="h-20 bg-black" />}>
        <Footer />
      </Suspense>
    </>
  )
}