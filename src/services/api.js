const BASE_URL = '/api'

export const calculateShipping = async (cep) => {
  const res = await fetch(`${BASE_URL}/calculateShipping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cep }),
  })

  if (!res.ok) throw new Error('Erro ao calcular frete')
  return res.json()
}

export const createPayment = async ({ orderId, userId, email }) => {
  const res = await fetch(`${BASE_URL}/createPayment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, userId, email }),
  })

  if (!res.ok) throw new Error('Erro ao criar pagamento')
  return res.json()
}