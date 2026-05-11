/**
 * Valida e aplica um cupom de desconto a um pedido.
 *
 * Segurança:
 *   - Cupons definidos apenas no servidor (nunca expostos ao cliente)
 *   - Requer autenticação Firebase (token verificado server-side)
 *   - Rate limiting: 10 tentativas/minuto por IP
 *   - Idempotente: se o pedido já tem cupom, retorna o desconto existente
 */

const admin = require('./_firebase.js')
const { requireAuth } = require('./_authMiddleware.js')
const { checkRateLimit } = require('./_rateLimiter.js')

// ── Catálogo de cupons — NUNCA envie isso ao front-end ──────────────────────
const VALID_COUPONS = {
  ESTRELA10: { discount: 0.10, label: '10% de desconto', active: true },
  LAUNCH15:  { discount: 0.15, label: '15% de desconto', active: true },
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Rate limit: 10 tentativas de cupom/minuto por IP (previne brute-force)
  if (!await checkRateLimit(req, res, { limit: 10, window: 60 })) return

  const caller = await requireAuth(req, res)
  if (!caller) return

  const { uid: userId } = caller
  const { code, orderId } = req.body

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Código de cupom inválido' })
  }

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'orderId é obrigatório' })
  }

  const normalizedCode = code.trim().toUpperCase()

  try {
    // Confirma que o pedido pertence ao usuário e está pendente
    const orderRef = admin.firestore().collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Pedido não encontrado' })
    }

    const order = orderSnap.data()

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Pedido já processado' })
    }

    // Idempotência: se já tem um cupom aplicado, retorna ele
    if (order.coupon?.code) {
      return res.status(200).json({
        valid: true,
        code: order.coupon.code,
        discount: order.coupon.discount,
        label: order.coupon.label,
      })
    }

    // Valida o cupom
    const coupon = VALID_COUPONS[normalizedCode]

    if (!coupon || !coupon.active) {
      // Resposta propositalmente vaga — não revela se o cupom existe mas está inativo
      return res.status(200).json({ valid: false, error: 'Cupom inválido ou expirado.' })
    }

    // Persiste o cupom no pedido via Admin SDK (não pelo cliente)
    await orderRef.update({
      coupon: {
        code: normalizedCode,
        discount: coupon.discount,
        label: coupon.label,
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({
      valid: true,
      code: normalizedCode,
      discount: coupon.discount,
      label: coupon.label,
    })

  } catch (err) {
    console.error('Erro validateCoupon:', err)
    return res.status(500).json({ error: 'Erro ao validar cupom' })
  }
}