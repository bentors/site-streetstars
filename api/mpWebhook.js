const admin = require('./_firebase.js')
const axios = require('axios')
const crypto = require('crypto')
const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Verificação por secret token na URL ─────────────────────────────────────
function verifySecret(req) {
  const token = req.query?.secret
  if (!token || !process.env.MP_WEBHOOK_SECRET) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(process.env.MP_WEBHOOK_SECRET)
    )
  } catch {
    return false
  }
}

// ─── Extrai o payment ID independente do formato (novo ou legado) ─────────────
// Formato novo:  { type: 'payment', data: { id: '123' } }
// Formato legado: { topic: 'payment', resource: 'https://.../v1/payments/123' }
function extractPaymentId(body) {
  if (body.type === 'payment' && body.data?.id) {
    return String(body.data.id)
  }
  if (body.topic === 'payment' && body.resource) {
    const parts = body.resource.split('/')
    return parts[parts.length - 1]
  }
  return null
}

// ─── Handler principal ────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed')
  }

  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body) } catch { req.body = {} }
  }

  // ── Rejeitar requisições sem secret válido ──
  if (!verifySecret(req)) {
    console.warn('mpWebhook: secret inválido rejeitado')
    return res.status(401).send('Unauthorized')
  }

  const body = req.body || {}

  // ── Ignorar eventos que não sejam de pagamento ──
  const isPaymentEvent = body.type === 'payment' || body.topic === 'payment'
  if (!isPaymentEvent) {
    return res.status(200).send('OK')
  }

  // ── Extrair payment ID dos dois formatos possíveis ──
  const paymentId = extractPaymentId(body)
  if (!paymentId) {
    console.warn('mpWebhook: payment ID não encontrado no body', JSON.stringify(body))
    return res.status(200).send('OK')
  }

  try {
    // ── Buscar detalhes do pagamento na API do MP ──
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        }
      }
    )

    const payment = response.data
    const orderId = payment.external_reference

    if (!orderId) {
      console.warn('mpWebhook: external_reference vazio para payment', paymentId)
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
      'payment.paymentId': String(paymentId),
      'payment.method': payment.payment_type_id || null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`mpWebhook: pedido ${orderId} atualizado para ${newStatus}`)

    // ── Enviar e-mail de confirmação apenas quando pago ──
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