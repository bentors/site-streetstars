import { lazy } from 'react'
import { useState } from 'react'
import Overlay from './components/Overlay'


import Header from './components/Header'
import Hero from './components/Hero'
const Shop = lazy(() => import('./components/Shop'))
const About = lazy(() => import('./components/About'))
const Collections = lazy(() => import('./components/Collections'))
const Manifesto = lazy(() => import('./components/Manifesto'))
const Contact = lazy(() => import('./components/Contact'))
import FloatingAction from './components/FloatingAction'
import Footer from './components/Footer'
import './index.css'

export default function App() {
  const [overlayActive, setOverlayActive] = useState(false)

  return (
    
    <div 
      id="top"
      className="min-h-screen bg-black text-white font-sans overflow-x-hidden">

      <Overlay active={overlayActive} onClick={() => setOverlayActive(false)} />

      <Header setOverlayActive={setOverlayActive} />

      <main id="main-content">
        <Hero />
        <Shop />
        <Collections />
        <Manifesto />
        <About />
        <Contact />
      </main>

      <FloatingAction setOverlayActive={setOverlayActive} />
      <Footer />
    </div>
  )
}

