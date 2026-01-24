import { Suspense, lazy, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Hero from '../components/Hero'

const Shop = lazy(() => import('../components/Shop'))
const Collections = lazy(() => import('../components/Collections'))
const Manifesto = lazy(() => import('../components/Manifesto'))
const About = lazy(() => import('../components/About'))

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
          element.scrollIntoView({ behavior: 'smooth' })
          window.history.replaceState({}, document.title)
        } else if (attempts < 5) {
          setTimeout(() => attemptScroll(attempts + 1), 300)
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
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <Collections />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <Manifesto />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <About />
      </Suspense>

    </main>
  )
}