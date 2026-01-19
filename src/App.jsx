import { lazy, Suspense } from 'react'
import { useState } from 'react'
import Overlay from './components/Overlay'
import Header from './components/Header'
import Hero from './components/Hero'
import FloatingAction from './components/FloatingAction'
import Footer from './components/Footer'
import './index.css'

const Shop = lazy(() => import('./components/Shop'))
const About = lazy(() => import('./components/About'))
const Collections = lazy(() => import('./components/Collections'))
const Manifesto = lazy(() => import('./components/Manifesto'))
const Contact = lazy(() => import('./components/Contact'))

const Loading = () => (
  <div className="h-20 w-full flex items-center justify-center bg-black">
    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export default function App() {
  const [overlayActive, setOverlayActive] = useState(false)

  return (
    <div 
      id="top"
      className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-white selection:text-black"
    >

      <Overlay active={overlayActive} onClick={() => setOverlayActive(false)} />

      <Header setOverlayActive={setOverlayActive} />

      <main id="main-content">
        <Hero />
        
        <Suspense fallback={<Loading />}>
          <section id="shop"><Shop /></section>
          <section id="collections"><Collections /></section>
          <section id="manifesto"><Manifesto /></section>
          <section id="about"><About /></section>
          <section id="contact"><Contact /></section>
        </Suspense>
      </main>

      <FloatingAction setOverlayActive={setOverlayActive} />
      <Footer />
    </div>
  )
}