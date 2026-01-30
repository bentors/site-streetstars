import { Suspense, lazy, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import Hero from '../components/home/Hero'

const Shop = lazy(() => import('../components/shop/Shop'))
const Collections = lazy(() => import('../components/home/Collections'))
const Manifesto = lazy(() => import('../components/home/Manifesto'))
const About = lazy(() => import('../components/home/About'))

const SectionLoader = () => (
  <div className="w-full py-24 flex items-center justify-center opacity-20">
    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export default function Home() {
  const location = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo

      const attemptScroll = (attempts = 0) => {
        const element = document.getElementById(sectionId)
        if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY
          const isMobile = window.innerWidth < 768

          const yOffset = isMobile ? 27 : 20
          window.scrollTo({ top: y + yOffset, behavior: 'smooth' })
          window.history.replaceState({}, document.title)
        } else if (attempts < 10) {
          setTimeout(() => attemptScroll(attempts + 1), 100)
        }
      }
      attemptScroll()
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  return (
    <main id="main-content" className="bg-black min-h-screen">
      <Hero />
      <Suspense fallback={<SectionLoader />}>
        <Shop />
        <Collections />
        <Manifesto />
        <About />
      </Suspense>
    </main>
  )
}