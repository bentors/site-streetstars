/**
 * Cria uma preferência de pagamento no Mercado Pago após:
 *   1. Verificar o ID Token Firebase do usuário (não confia no body)
 *   2. Confirmar que o pedido pertence ao uid verificado
 *   3. Revalidar preços contra o catálogo do servidor
 */

const admin = require('./_firebase.js')
const { MercadoPagoConfig, Preference } = require('mercadopago')
const { requireAuth } = require('./_authMiddleware.js')
const { checkRateLimit } = require('./_rateLimiter.js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Rate limit: 5 criações de pagamento/minuto por IP
  if (!await checkRateLimit(req, res, { limit: 5, window: 60 })) return

  // ── Autenticação: uid vem do token ─────────────────────────
  const caller = await requireAuth(req, res)
  if (!caller) return

  const { uid: userId, email: tokenEmail } = caller

  // orderId vem do body
  const { orderId } = req.body
  const email = tokenEmail || req.body.email || ''

  if (!orderId) {
    return res.status(400).json({ error: 'orderId é obrigatório' })
  }

  try {
    const orderRef = admin.firestore().collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Pedido não encontrado' })
    }

    const order = orderSnap.data()

    // Confirma que o pedido pertence ao usuário autenticado
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Pedido já processado' })
    }

    // ── Buscar itens do pedido ──────────────────────────────────────────────
    const itemsSnap = await orderRef.collection('items').get()
    const orderItems = itemsSnap.docs.map(d => d.data())

    // ── Revalidar preços contra o catálogo — nunca confiar no cliente ───────
    const itemsWithRealPrices = await Promise.all(
      orderItems.map(async (item) => {
        const productRef = admin.firestore().collection('products').doc(item.productId)
        const productSnap = await productRef.get()

        if (!productSnap.exists) {
          throw new Error(`Produto não encontrado: ${item.productId}`)
        }

        const catalogPrice = productSnap.data().price

        if (typeof catalogPrice !== 'number' || catalogPrice <= 0) {
          throw new Error(`Preço inválido para produto: ${item.productId}`)
        }

        await itemsSnap.docs
          .find(d => d.data().productId === item.productId)
          ?.ref.update({ price: catalogPrice })

        return {
          id: item.productId,
          title: item.name,
          quantity: item.quantity,
          unit_price: catalogPrice,
          currency_id: 'BRL',
        }
      })
    )

    // ── Recalcular total real (incluindo desconto de cupom validado) ─────────
    const realSubtotal = itemsWithRealPrices.reduce(
      (acc, item) => acc + item.unit_price * item.quantity, 0
    )
    const shippingPrice = order.shipping?.price || 0

    // Cupom já foi validado e persistido pelo endpoint /api/validateCoupon
    // Lê do Firestore — nunca do body da requisição
    const couponDiscount = order.coupon?.discount || 0
    const discountAmount = parseFloat((realSubtotal * couponDiscount).toFixed(2))
    const realTotal = parseFloat((realSubtotal - discountAmount + shippingPrice).toFixed(2))

    await orderRef.update({
      total: realTotal,
      subtotal: realSubtotal,
      discountAmount,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    // ── Criar preferência no Mercado Pago ───────────────────────────────────
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    })

    const preference = new Preference(client)

    const preferenceData = await preference.create({
      body: {
        items: itemsWithRealPrices,
        payer: { email },
        shipments: {
          cost: shippingPrice,
          mode: 'not_specified',
        },
        back_urls: {
          success: `${process.env.ALLOWED_ORIGIN}/pedido/${orderId}?status=success`,
          failure: `${process.env.ALLOWED_ORIGIN}/pedido/${orderId}?status=failure`,
          pending: `${process.env.ALLOWED_ORIGIN}/pedido/${orderId}?status=pending`,
        },
        auto_return: 'approved',
        external_reference: orderId,
        notification_url: `${process.env.ALLOWED_ORIGIN}/api/mpWebhook`,
      }
    })

    await orderRef.update({
      'payment.preferenceId': preferenceData.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({
      preferenceId: preferenceData.id,
      initPoint: preferenceData.init_point,
    })

  } catch (err) {
    console.error('Erro createPayment:', err)
    return res.status(500).json({ error: 'Erro ao criar pagamento' })
  }
}