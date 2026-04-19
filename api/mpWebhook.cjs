const admin = require('./_firebase.cjs')
const axios = require('axios')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed')
  }

  const { type, data } = req.body

  if (type !== 'payment') {
    return res.status(200).send('OK')
  }

  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        }
      }
    )

    const payment = response.data
    const orderId = payment.external_reference

    if (!orderId) {
      return res.status(200).send('OK')
    }

    const statusMap = {
      approved: 'paid',
      rejected: 'cancelled',
      cancelled: 'cancelled',
      refunded: 'cancelled',
      pending: 'pending',
      in_process: 'pending',
    }

    const newStatus = statusMap[payment.status] || 'pending'

    await admin.firestore()
      .collection('orders')
      .doc(orderId)
      .update({
        status: newStatus,
        'payment.paymentId': String(data.id),
        'payment.method': payment.payment_type_id || null,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

    return res.status(200).send('OK')

  } catch (err) {
    console.error('Erro mpWebhook:', err)
    return res.status(500).send('Error')
  }
}