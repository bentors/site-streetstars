export function normalizeCpf(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidCpf(input: string): boolean {
  const cpf = normalizeCpf(input)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digits = cpf.split('').map(Number)
  const checkDigit = (length: number) => {
    const sum = digits.slice(0, length).reduce((acc, d, i) => acc + d * (length + 1 - i), 0)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10]
}

export function formatCpf(input: string): string {
  return normalizeCpf(input)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}
