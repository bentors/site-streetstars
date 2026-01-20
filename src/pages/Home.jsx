import { Suspense, lazy, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Hero from '../components/Hero'

const Shop = lazy(() => import('../components/Shop'))
const Collections = lazy(() => import('../components/Collections'))
const Manifesto = lazy(() => import('../components/Manifesto'))
const About = lazy(() => import('../components/About'))

const LoadingSection = () => (
  <div className="h-[50vh] w-full flex items-center justify-center bg-black">
    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
  </div>
)

export default function Home() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })

          window.history.replaceState({}, document.title)
        }
      }, 500)
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  return (
    <main id="main-content" className="bg-black min-h-screen">

      <Hero />

      <Suspense fallback={<LoadingSection />}>
        <Shop />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <Collections />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <Manifesto />
      </Suspense>

      <Suspense fallback={<LoadingSection />}>
        <About />
      </Suspense>

    </main>
  )
}