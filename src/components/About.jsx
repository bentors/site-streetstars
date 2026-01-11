import about from '../assets/images/about.jpg'
import aboutus from '../assets/images/aboutus.jpg'

export default function About() {
  return (
    <section id="about" className="py-32 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        <img
          src={aboutus}
          className="w-full h-64 md:h-[420px] object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
        />

        <div>
          <h2 className="text-4xl font-display mb-6">Nossa história</h2>
          <p className="text-white/70 leading-relaxed">
            A Street Stars surgiu da vontade de transformar vivências urbanas em vestuário.
            Inspirada pela rua, música e cultura street, representamos quem se expressa
            sem pedir permissão.
          </p>
        </div>

      </div>
    </section>
  )
}
