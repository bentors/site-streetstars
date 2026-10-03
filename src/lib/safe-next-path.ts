const BASE = 'http://internal.invalid'

/** Aceita só caminhos internos; qualquer coisa que leve a outro host vira o fallback. */
export function safeNextPath(input: string | null | undefined, fallback = '/'): string {
  if (!input || !input.startsWith('/') || input.startsWith('//')) return fallback
  try {
    // O parser de URL trata "\" como "/", então "/\evil.com" cai em outro host e é recusado.
    const url = new URL(input, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
