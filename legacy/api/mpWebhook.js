const admin = require('./_firebase.js')
const axios = require('axios')
const crypto = require('crypto')
const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Sanitiza strings antes de interpolar em HTML.
 * Previne HTML injection / CSS injection em e-mails transacionais.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function verifySignature(req) {
  try {
    const signature = req.headers['x-signature']
    const requestId = req.headers['x-request-id']

    if (!signature || !requestId || !process.env.MP_WEBHOOK_SECRET) return false

    const parts = {}
    signature.split(',').forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) parts[key.trim()] = value.trim()
    })

    const ts = parts['ts']
    const v1 = parts['v1']
    if (!ts || !v1) return false

    const dataId = req.query?.['data.id'] || req.query?.id || req.body?.data?.id || ''
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`

    const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex')
    let isValid = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))

    if (!isValid && dataId === '') {
      const fallbackManifest = `id:;request-id:${requestId};ts:${ts};`
      const fallbackHmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(fallbackManifest).digest('hex')
      if (crypto.timingSafeEqual(Buffer.from(fallbackHmac), Buffer.from(v1))) isValid = true
    }

    return isValid
  } catch {
    return false
  }
}

function extractPaymentId(req) {
  const body = req.body || {}
  const query = req.query || {}

  if (body.type === 'payment' && body.data?.id) return String(body.data.id)
  if (body.topic === 'payment' && body.resource) {
    const parts = body.resource.split('/')
    return parts[parts.length - 1]
  }
  if (query['data.id']) return String(query['data.id'])
  if (query['id']) return String(query['id'])

  return null
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature, x-request-id')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body) } catch { req.body = {} }
  }

  if (!verifySignature(req)) {
    console.warn('mpWebhook: assinatura inválida rejeitada')
    return res.status(401).send('Unauthorized')
  }

  const body = req.body || {}
  const query = req.query || {}

  const isPaymentEvent = body.type === 'payment' || body.topic === 'payment'
    || query.type === 'payment' || query.topic === 'payment'
  if (!isPaymentEvent) return res.status(200).send('OK')

  const paymentId = extractPaymentId(req)
  if (!paymentId) return res.status(200).send('OK')

  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } }
    )

    const payment = response.data
    const orderId = payment.external_reference

    if (!orderId) return res.status(200).send('OK')

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

    console.log(`mpWebhook: pedido ${orderId} → ${newStatus}`)

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
              <span style="color: #fff; font-size: 13px;">${escapeHtml(item.name)}</span><br/>
              <span style="color: #888; font-size: 11px;">Tam: ${escapeHtml(item.size)}${item.color ? ` · Cor: ${escapeHtml(item.color)}` : ''} · Qtd: ${escapeHtml(item.quantity)}</span>
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
          html: `<!DOCTYPE html>
            <html>
              <head><meta charset="UTF-8"></head>
              <body style="background:#000;color:#fff;font-family:sans-serif;padding:40px 20px;margin:0;">
                <div style="max-width:520px;margin:0 auto;">
                  <h1 style="font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Street Stars ⭐</h1>
                  <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px;">Confirmação de Pedido</p>
                  <div style="background:#111;border:1px solid #222;padding:24px;margin-bottom:24px;">
                    <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 4px;">Pedido</p>
                    <p style="color:#fff;font-size:16px;font-weight:700;margin:0;">#${orderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div style="background:#111;border:1px solid #222;padding:24px;margin-bottom:24px;">
                    <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 16px;">Itens</p>
                    <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
                    <table style="width:100%;margin-top:16px;">
                      <tr>
                        <td style="color:#888;font-size:12px;">Subtotal</td>
                        <td style="text-align:right;color:#888;font-size:12px;">R$ ${(total - shippingPrice).toFixed(2).replace('.', ',')}</td>
                      </tr>
                      <tr>
                        <td style="color:#888;font-size:12px;padding-top:4px;">Frete (${escapeHtml(order.shipping?.name || '')})</td>
                        <td style="text-align:right;color:#888;font-size:12px;padding-top:4px;">R$ ${shippingPrice.toFixed(2).replace('.', ',')}</td>
                      </tr>
                      <tr>
                        <td style="color:#fff;font-size:14px;font-weight:700;padding-top:12px;border-top:1px solid #333;">Total</td>
                        <td style="text-align:right;color:#fff;font-size:14px;font-weight:700;padding-top:12px;border-top:1px solid #333;">R$ ${total.toFixed(2).replace('.', ',')}</td>
                      </tr>
                    </table>
                  </div>
                  <div style="background:#111;border:1px solid #222;padding:24px;margin-bottom:32px;">
                    <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 8px;">Endereço de Entrega</p>
                    <p style="color:#fff;font-size:13px;margin:0;line-height:1.6;">
                      ${escapeHtml(order.address?.street)}, ${escapeHtml(order.address?.number)}${order.address?.complement ? ` — ${escapeHtml(order.address.complement)}` : ''}<br/>
                      ${escapeHtml(order.address?.neighborhood)} — ${escapeHtml(order.address?.city)}/${escapeHtml(order.address?.state)}<br/>
                      CEP: ${escapeHtml(order.address?.cep)}
                    </p>
                  </div>
                  <p style="color:#555;font-size:11px;text-align:center;text-transform:uppercase;letter-spacing:0.15em;">
                    Street Stars — São Paulo, SP<br/>streetstarsco@gmail.com
                  </p>
                </div>
              </body>
            </html>`
        })

        console.log(`mpWebhook: e-mail enviado para ${userEmail}`)
      } catch (emailErr) {
        console.error('mpWebhook: erro ao enviar e-mail:', emailErr.message)
      }
    }

    return res.status(200).send('OK')

  } catch (err) {
    console.error('mpWebhook: erro:', err.message)
    return res.status(500).send('Error')
  }
}