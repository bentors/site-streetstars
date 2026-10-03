export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validateCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let soma = 0
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf[9])) return false

  soma = 0
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(cpf[10])
}

/**
 * Valida a senha com critérios mínimos para um e-commerce com dados sensíveis.
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra
 * - Pelo menos 1 número
 *
 * @param {string} password
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'A senha deve ter ao menos 8 caracteres.' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'A senha deve conter ao menos uma letra.' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'A senha deve conter ao menos um número.' }
  }
  return { valid: true, error: null }
}

/**
 * Avalia a força da senha para feedback visual.
 * @param {string} password
 * @returns {'fraca' | 'média' | 'forte'}
 */
export const passwordStrength = (password) => {
  if (!password || password.length < 8) return 'fraca'
  const hasLetter  = /[a-zA-Z]/.test(password)
  const hasNumber  = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  const isLong     = password.length >= 12

  const score = [hasLetter, hasNumber, hasSpecial, isLong].filter(Boolean).length
  if (score <= 2) return 'fraca'
  if (score === 3) return 'média'
  return 'forte'
}

export const formatCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '')
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const formatPhone = (phone) => {
  phone = phone.replace(/[^\d]/g, '')
  if (phone.length === 11) return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (phone.length === 10) return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return phone
}

export const formatCEP = (cep) => {
  cep = cep.replace(/[^\d]/g, '')
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
}