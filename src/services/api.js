import { auth } from './firebase'

const BASE_URL = '/api'

async function getAuthHeader() {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')
  const idToken = await user.getIdToken()
  return { 'Authorization': `Bearer ${idToken}` }
}

export const calculateShipping = async (cep) => {
  const authHeader = await getAuthHeader()

  const res = await fetch(`${BASE_URL}/calculateShipping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ cep }),
  })

  if (!res.ok) throw new Error('Erro ao calcular frete')
  return res.json()
}

export const createPayment = async ({ orderId }) => {
  const authHeader = await getAuthHeader()
  const user = auth.currentUser

  const res = await fetch(`${BASE_URL}/createPayment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      orderId,
      email: user?.email || '',
    }),
  })

  if (!res.ok) throw new Error('Erro ao criar pagamento')
  return res.json()
}

/**
 * Valida um cupom de desconto no servidor e o persiste no pedido.
 * Retorna { valid, code, discount, label } ou { valid: false, error }.
 * Os cupons existem APENAS no servidor — nunca são expostos ao bundle JS.
 */
export const validateCoupon = async ({ code, orderId }) => {
  const authHeader = await getAuthHeader()

  const res = await fetch(`${BASE_URL}/validateCoupon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ code, orderId }),
  })

  // 200 mesmo em cupom inválido — o campo `valid` indica o resultado
  if (!res.ok) throw new Error('Erro ao validar cupom')
  return res.json()
}