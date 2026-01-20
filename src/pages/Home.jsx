import Hero from '../components/Hero'
import Shop from '../components/Shop'
import Collections from '../components/Collections'
import Manifesto from '../components/Manifesto'
import About from '../components/About'
import { Suspense } from 'react'

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <Shop />
      <Collections />
      <Manifesto />
      <About />
    </main>
  )
}