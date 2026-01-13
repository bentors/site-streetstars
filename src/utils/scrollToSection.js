export function scrollToSection(id) {
  const section = document.querySelector(id)
  const headerOffset = 64 // altura do header (h-16)
  const elementPosition = section?.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.scrollY - headerOffset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  })
}
