import { Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'

import Header from './Header'
import FloatingAction from './FloatingAction'
import ScrollToTop from '../../utils/ScrollToTop'

const CartDrawer = lazy(() => import('./CartDrawer'))
const Footer = lazy(() => import('./Footer'))

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