const BASE = 'http://internal.invalid'

/** Aceita só caminhos internos; qualquer coisa que leve a outro host vira o fallback. */
export function safeNextPath(input: string | null | undefined, fallback = '/'): string {
  if (!input || !input.startsWith('/') || input.startsWith('//')) return fallback
  try {
    // O parser de URL trata "\" como "/", então "/\evil.com" cai em outro host e é recusado.
    const url = new URL(input, BASE)
    if (url.origin !== BASE) return fallback
    const path = `${url.pathname}${url.search}${url.hash}`
    // A normalização pode gerar "//host" a partir de "/.//host" ou "/a/..//host":
    // o navegador trataria isso como outro site.
    if (path.startsWith('//') || path.startsWith('/\\')) return fallback
    return path
  } catch {
    return fallback
  }
}
