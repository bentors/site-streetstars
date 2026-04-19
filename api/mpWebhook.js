const admin = require('./_firebase.js')
const axios = require('axios')
const crypto = require('crypto')
const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Verificação de assinatura HMAC do Mercado Pago ──────────────────────────
function verifyMercadoPagoSignature(req) {
  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']

  if (!xSignature || !xRequestId) return false

  const dataId = req.query?.['data.id'] || req.body?.data?.id

  const parts = xSignature.split(',')
  let ts = null
  let receivedHash = null

  for (const part of parts) {
    const [key, value] = part.trim().split('=')
    if (key === 'ts') ts = value
    if (key === 'v1') receivedHash = value
  }

  if (!ts || !receivedHash) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const expectedHash = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(receivedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  )
}

// ─── Handler principal ────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed')
  }

  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body) } catch { req.body = {} }
  }

  // ── Rejeitar requisições sem assinatura válida ──
  if (!verifyMercadoPagoSignature(req)) {
    console.warn('mpWebhook: assinatura inválida rejeitada')
    return res.status(401).send('Unauthorized')
  }

  const { type, data } = req.body || {}

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

    const orderRef = admin.firestore().collection('orders').doc(orderId)

    await orderRef.update({
      status: newStatus,
      'payment.paymentId': String(data.id),
      'payment.method': payment.payment_type_id || null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (newStatus === 'paid') {
      try {
        const orderSnap = await orderRef.get()
        const order = orderSnap.data()

        const itemsSnap = await orderRef.collection('items').get()
        const items = itemsSnap.docs.map(d => d.data())

        const userRecord = await admin.auth().getUser(order.userId)
        const userEmail = userRecord.email

        const itemsHtml = items.map(item => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #222;">
              <span style="color: #fff; font-size: 13px;">${item.name}</span><br/>
              <span style="color: #888; font-size: 11px;">Tam: ${item.size}${item.color ? ` · Cor: ${item.color}` : ''} · Qtd: ${item.quantity}</span>
            </td>
            <td style="padding: 8px 0; border-bottom: 1px solid #222; text-align: right; color: #fff; font-size: 13px;">
              R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}
            </td>
          </tr>
        `).join('')

        const shippingPrice = order.shipping?.price || 0
        const total = order.total || 0

        await resend.emails.send({
          from: 'Street Stars <onboarding@resend.dev>',
          to: userEmail,
          subject: `Pedido confirmado — #${orderId.slice(0, 8).toUpperCase()}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head><meta charset="UTF-8"></head>
              <body style="background:#000; color:#fff; font-family: sans-serif; padding: 40px 20px; margin: 0;">
                <div style="max-width: 520px; margin: 0 auto;">
                  <h1 style="font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
                    Street Stars ⭐
                  </h1>
                  <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 32px;">
                    Confirmação de Pedido
                  </p>
                  <div style="background: #111; border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
                    <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px;">Pedido</p>
                    <p style="color: #fff; font-size: 16px; font-weight: 700; margin: 0;">#${orderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div style="background: #111; border: 1px solid #222; padding: 24px; margin-bottom: 24px;">
                    <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 16px;">Itens</p>
                    <table style="width: 100%; border-collapse: collapse;">
                      ${itemsHtml}
                    </table>
                    <table style="width: 100%; margin-top: 16px;">
                      <tr>
                        <td style="color: #888; font-size: 12px;">Subtotal</td>
                        <td style="text-align: right; color: #888; font-size: 12px;">R$ ${(total - shippingPrice).toFixed(2).replace('.', ',')}</td>
                      </tr>
                      <tr>
                        <td style="color: #888; font-size: 12px; padding-top: 4px;">Frete (${order.shipping?.name || ''})</td>
                        <td style="text-align: right; color: #888; font-size: 12px; padding-top: 4px;">R$ ${shippingPrice.toFixed(2).replace('.', ',')}</td>
                      </tr>
                      <tr>
                        <td style="color: #fff; font-size: 14px; font-weight: 700; padding-top: 12px; border-top: 1px solid #333;">Total</td>
                        <td style="text-align: right; color: #fff; font-size: 14px; font-weight: 700; padding-top: 12px; border-top: 1px solid #333;">R$ ${total.toFixed(2).replace('.', ',')}</td>
                      </tr>
                    </table>
                  </div>
                  <div style="background: #111; border: 1px solid #222; padding: 24px; margin-bottom: 32px;">
                    <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px;">Endereço de Entrega</p>
                    <p style="color: #fff; font-size: 13px; margin: 0; line-height: 1.6;">
                      ${order.address?.street}, ${order.address?.number}
                      ${order.address?.complement ? ` — ${order.address.complement}` : ''}<br/>
                      ${order.address?.neighborhood} — ${order.address?.city}/${order.address?.state}<br/>
                      CEP: ${order.address?.cep}
                    </p>
                  </div>
                  <p style="color: #555; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 0.15em;">
                    Street Stars — São Paulo, SP<br/>
                    streetstarsco@gmail.com
                  </p>
                </div>
              </body>
            </html>
          `
        })
      } catch (emailErr) {
        console.error('Erro ao enviar e-mail:', emailErr)
      }
    }

    return res.status(200).send('OK')

  } catch (err) {
    console.error('Erro mpWebhook:', err)
    return res.status(500).send('Error')
  }
}