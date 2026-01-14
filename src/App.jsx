import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Collections from './components/Collections'
import Manifesto from './components/Manifesto'
import Contact from './components/Contact'
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

