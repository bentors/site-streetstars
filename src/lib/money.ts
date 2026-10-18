/** Valor monetário em centavos inteiros. Nunca use reais em float para cálculos. */
export type Cents = number

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function isCents(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function toCents(reais: number): Cents {
  if (!Number.isFinite(reais) || reais < 0) throw new RangeError(`Valor inválido: ${reais}`)
  return Math.round(reais * 100)
}

/** Converte texto digitado ("129,90", "129.9", "129") em centavos, sem passar por float. */
export function parseReaisToCents(input: string): Cents | null {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(input.trim())
  if (!match) return null
  const [, whole = '', fraction = ''] = match
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

export function formatBRL(cents: Cents): string {
  return brl.format(cents / 100)
}

/** Centavos para o campo de texto do admin: 14990 → "149,90". */
export function formatCentsInput(cents: Cents): string {
  const reais = Math.floor(cents / 100)
  return `${reais},${String(cents % 100).padStart(2, '0')}`
}
