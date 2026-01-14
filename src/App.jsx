import { lazy, Suspense } from 'react'

const About = lazy(() => import('./components/About'))
const Collections = lazy(() => import('./components/Collections'))
const Manifesto = lazy(() => import('./components/Manifesto'))
const Contact = lazy(() => import('./components/Contact'))


import Header from './components/Header'
import Hero from './components/Hero'
<Suspense fallback={null}>
  <About />
  <Collections />
  <Manifesto />
  <Contact />
</Suspense>
import Footer from './components/Footer'
import './index.css'

export default function App() {
  return (
    <div 
      id="top"
      className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      <Header />

      <main id="main-content">
        <Hero />
        <About />
        <Collections />
        <Manifesto />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}

