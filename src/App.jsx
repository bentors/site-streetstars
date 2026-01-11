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
    <div className="bg-black text-white min-h-screen font-sans">
      <Header />
      <Hero />
      <About />
      <Collections />
      <Manifesto />
      <Contact />
      <Footer />
    </div>
  )
}
