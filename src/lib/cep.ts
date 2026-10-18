export function normalizeCep(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidCep(input: string): boolean {
  const cep = normalizeCep(input)
  return /^\d{8}$/.test(cep) && cep !== '00000000'
}

export function formatCep(input: string): string {
  return normalizeCep(input)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2')
}

/** Preenche com o ViaCEP sem apagar o que já foi digitado (CEP de cidade inteira vem sem rua). */
export function fillFromCep<T extends object>(
  current: T,
  found: Partial<Record<keyof T & string, string>>,
): T {
  const filled = Object.entries(found).filter(([, value]) => typeof value === 'string' && value)
  return { ...current, ...Object.fromEntries(filled) }
}
