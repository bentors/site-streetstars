export function scrollToSection(id) {
  const section = document.querySelector(id)
  if (!section) return

  const headerOffset = 80
  const elementPosition = section?.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - window.innerHeight / 15

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  })
}
