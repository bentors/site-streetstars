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
    "@type": "ClothingStore",
    "name": "Street Stars",
    "url": "https://streetstars.vercel.app",
    "logo": optimizeImage(HERO_RAW_URL, 500),
    "description": "Streetwear autêntico nascido em São Paulo. Transformamos vivência urbana em estilo.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "São Paulo",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "sameAs": [
      "https://www.instagram.com/_streetstars.co/"
    ],
    "foundingDate": "2024",
    "founders": [
      { "@type": "Person", "name": "Felipe dos Santos" },
      { "@type": "Person", "name": "Bento Rangel" }
    ]
  }

  return (
    <script type='application/ld+json'>
      {JSON.stringify(schemaData)}
    </script>
  )
}

const SectionLoader = ({ minHeight = "min-h-[50vh]" }) => (
  <div className={`w-full ${minHeight} flex items-center justify-center bg-black transition-opacity duration-300`}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
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

      const scrollToSection = (attempts = 0) => {
        const element = document.getElementById(sectionId)
       
        if (element) {

          const isMobile = window.innerWidth < 768
          const offset = isMobile ? 60 : 80
         
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - offset
         
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })

          window.history.replaceState({}, document.title)
        } else if (attempts < 25) {
          setTimeout(() => scrollToSection(attempts + 1), 100)
        }
      }

      setTimeout(() => scrollToSection(), 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  return (
    <main id="main-content" className="bg-black min-h-screen">
      <Helmet>
        <title>Street Stars | Estrelas nascem nas ruas</title>
        <meta
          name="description"
          content="Streetwear autêntico nascido em São Paulo. Transformamos vivência urbana em estilo, identidade e movimento."
        />

        <meta property="og:title" content="Street Stars — Seja uma Estrela das Ruas" />
        <meta property="og:description" content="Streetwear autêntico nascido em São Paulo." />
        <meta property="og:image" content={optimizeImage(HERO_RAW_URL, 1200)} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://streetstars.vercel.app/" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Street Stars — Seja uma Estrela das Ruas" />
        <meta name="twitter:description" content="Streetwear autêntico nascido em São Paulo." />
        <meta name="twitter:image" content={optimizeImage(HERO_RAW_URL, 1200)} />

        <link rel="canonical" href="https://streetstars.vercel.app/" />

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