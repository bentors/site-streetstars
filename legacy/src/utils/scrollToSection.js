/**
 * Rola suavemente até uma seção específica
 * @param {string} selector
 * @param {number} offset
 */
export function scrollToSection(selector, offset = 60) {
  const element = document.querySelector(selector);
  
  if (!element) {
    console.warn(`Elemento não encontrado: ${selector}`);
    return;
  }

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
}

export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Verifica se um elemento está visível no viewport
 * @param {string} selector
 * @returns {boolean}
 */
export function isElementVisible(selector) {
  const element = document.querySelector(selector);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}