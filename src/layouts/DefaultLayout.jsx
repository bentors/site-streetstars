import { Outlet } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'

import Header from '../components/layout/Header'
import FloatingAction from '../components/layout/FloatingAction'
import ScrollToTop from '../utils/ScrollToTop'

const CartDrawer = lazy(() => import('../components/layout/CartDrawer'))
const Footer = lazy(() => import('../components/layout/Footer'))

export default function DefaultLayout() {
  const [isReadyForHeavyComponents, setIsReadyForHeavyComponents] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReadyForHeavyComponents(true)
    }, 3000)

    const handleInteraction = () => setIsReadyForHeavyComponents(true)

    window.addEventListener('scroll', handleInteraction, { once: true, passive: true })
    window.addEventListener('click', handleInteraction, { once: true, passive: true })
    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleInteraction)
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  return (
    <>
      <ScrollToTop />

      <Header />

      <main className="min-h-screen bg-black w-full selection:bg-white selection:text-black">
        <Outlet /> 
      </main>

      {isReadyForHeavyComponents && (
        <Suspense fallback={null}>
          <CartDrawer />
          <Footer />
        </Suspense>
      )}

      <FloatingAction />
    </>
  )
}