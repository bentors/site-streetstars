const admin = require('./_firebase.js')
const { MercadoPagoConfig, Preference } = require('mercadopago')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { orderId, userId, email } = req.body

  if (!orderId || !userId) {
    return res.status(400).json({ error: 'orderId e userId são obrigatórios' })
  }

  try {
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

    const itemsSnap = await orderRef.collection('items').get()
    const items = itemsSnap.docs.map(d => d.data())

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    })

    const preference = new Preference(client)

    const preferenceData = await preference.create({
      body: {
        items: items.map(item => ({
          id: item.productId,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'BRL',
        })),
        payer: {
          email: email || '',
        },
        shipments: {
          cost: order.shipping?.price || 0,
          mode: 'not_specified',
        },
        back_urls: {
          success: `${req.headers.origin}/pedido/${orderId}?status=success`,
          failure: `${req.headers.origin}/pedido/${orderId}?status=failure`,
          pending: `${req.headers.origin}/pedido/${orderId}?status=pending`,
        },
        auto_return: 'approved',
        external_reference: orderId,
        notification_url: `${req.headers.origin}/api/mpWebhook`,
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