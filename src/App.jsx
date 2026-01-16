import { lazy } from 'react'


import Header from './components/Header'
import Hero from './components/Hero'
const Shop = lazy(() => import('./components/Shop'))
const About = lazy(() => import('./components/About'))
const Collections = lazy(() => import('./components/Collections'))
const Manifesto = lazy(() => import('./components/Manifesto'))
const Contact = lazy(() => import('./components/Contact'))
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
        <Shop />
        <Collections />
        <Manifesto />
        <About />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}

