import { Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'

import Header from '../components/layout/Header'
import FloatingAction from '../components/layout/FloatingAction'
import ScrollToTop from '../utils/ScrollToTop'

const CartDrawer = lazy(() => import('../components/layout/CartDrawer'))
const Footer = lazy(() => import('../components/layout/Footer'))

export default function DefaultLayout() {
  return (
    <>
      <ScrollToTop />

      <Header />

      <main className="min-h-screen bg-black w-full selection:bg-white selection:text-black">
        <Outlet /> 
      </main>

      <Suspense fallback={null}>
        <CartDrawer />
        <Footer />
      </Suspense>

      <FloatingAction />
    </>
  )
}