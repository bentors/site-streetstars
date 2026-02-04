import { Suspense, lazy, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { optimizeImage } from '../utils/image'

import Hero from '../components/home/Hero'

const Shop = lazy(() => import('../components/shop/Shop'))
const Collections = lazy(() => import('../components/home/Collections'))
const Manifesto = lazy(() => import('../components/home/Manifesto'))
const About = lazy(() => import('../components/home/About'))

const HERO_RAW_URL = "https://res.cloudinary.com/dmsvju9ca/image/upload/v1769638546/hero_rb9jvq.jpg"
const HERO_IMAGE_PRELOAD = optimizeImage(HERO_RAW_URL, 1500)

const SchemaMarkup = () => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FashionBrand",
    "name": "Street Stars",
    "url": "https://streetstars.com.br",
    "logo": optimizeImage(HERO_RAW_URL, 500),
    "description": "Streetwear autêntico nascido em São Paulo.",
    "sameAs": [
      "https://www.instagram.com/_streetstars.co/",
      "https://www.facebook.com/streetstars"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-11-99999-9999",
      "contactType": "customer service"
    }
  }

  return (
    <script type='application/ld+json'>
      {JSON.stringify(schemaData)}
    </script>
  )
}

const SectionLoader = ({ minHeight = "min-h-[50vh]" }) => (
  <div className={`w-full ${minHeight} flex items-center justify-center bg-black opacity-20 transition-all`}>
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

          const yOffset = isMobile ? -60 : -80 
          
          window.scrollTo({ top: y + yOffset, behavior: 'smooth' })
          window.history.replaceState({}, document.title)
        } else if (attempts < 20) { 
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
      
      <Helmet>
        <title>Street Stars | Estrelas nascem nas ruas</title> 
        <meta name="description" content="A Street Stars nasceu da rua. Da vontade de transformar vivência urbana em estilo, identidade e movimento." />
        <meta property="og:title" content="Street Stars — Seja uma Estrela das Ruas" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://streetstars.com.br/" />

        <link rel="preload" as="image" href={HERO_IMAGE_PRELOAD} />
      </Helmet>

      <SchemaMarkup />

      <Hero />

      <Suspense fallback={<SectionLoader minHeight="min-h-[80vh]" />}>
        <Shop isHome={true} /> 
      </Suspense>

      <Suspense fallback={<SectionLoader minHeight="min-h-[60vh]" />}>
        <Collections />
      </Suspense>

      <Suspense fallback={<SectionLoader minHeight="min-h-screen" />}>
        <Manifesto />
      </Suspense>

      <Suspense fallback={<SectionLoader minHeight="min-h-[50vh]" />}>
        <About />
      </Suspense>
    </main>
  )
}