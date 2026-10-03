const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/**
 * Formata um valor para moeda BRL.
 * @param {number} value
 * @returns {string} ex: "R$ 199,90"
 */
export const formatCurrency = (value) => BRL.format(value)

/**
 * Formata o valor de uma parcela sem juros.
 * @param {number} total    - Valor total do produto
 * @param {number} installments - Número de parcelas (padrão: 6)
 * @returns {string} ex: "6x de R$ 33,32 sem juros"
 */
export const formatInstallment = (total, installments = 6) => {
  if (!total || total <= 0) return ''
  return `${installments}x de ${BRL.format(total / installments)} sem juros`
}