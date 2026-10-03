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
