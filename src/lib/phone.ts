export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidPhone(input: string): boolean {
  const phone = normalizePhone(input)
  if (!/^[1-9]\d\d{8,9}$/.test(phone)) return false
  return phone.length === 10 || phone[2] === '9'
}

export function formatPhone(input: string): string {
  const d = normalizePhone(input).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
