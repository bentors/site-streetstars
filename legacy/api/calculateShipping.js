/**
 * Calcula opções de frete via Melhor Envio.
 *
 * SEGURANÇA:
 *   - Requer autenticação Firebase (evita abuso do token Melhor Envio)
 *   - Valida e sanitiza o CEP antes de passar à API externa
 *   - Não expõe token ou detalhes internos em erros de resposta
 */

const axios = require('axios')
const { requireAuth } = require('./_authMiddleware.js')
const { checkRateLimit } = require('./_rateLimiter.js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Rate limit: 30 cálculos/minuto por IP (evita abuso do token Melhor Envio)
  if (!await checkRateLimit(req, res, { limit: 30, window: 60 })) return

  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body) } catch { req.body = {} }
  }

  // ── Autenticação obrigatória ──────────────────────────────────────────────
  // Protege o token do Melhor Envio de ser consumido por scripts externos.
  const caller = await requireAuth(req, res)
  if (!caller) return

  // ── Validação do CEP ──────────────────────────────────────────────────────
  const rawCep = (req.body?.cep || '').replace(/\D/g, '')
  if (rawCep.length !== 8) {
    return res.status(400).json({ error: 'CEP inválido' })
  }

  try {
    const response = await axios.get(
      'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHORENVIO_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'StreetStars/1.0 (streetstars.company@gmail.com)',
        },
        params: {
          from: { postal_code: process.env.MELHORENVIO_ORIGEM_CEP },
          to:   { postal_code: rawCep },
          package: { height: 5, width: 30, length: 30, weight: 0.5 },
          services: '1,2',
        },
      }
    )

    const options = response.data
      .filter(s => !s.error)
      .map(s => ({
        id: s.id,
        name: s.name,
        price: parseFloat(s.price),
        delivery_time: s.delivery_time,
        company: s.company?.name || '',
      }))

    return res.status(200).json({ options })
  } catch (err) {
    console.error('Erro Melhor Envio:', err?.response?.data || err.message)
    return res.status(500).json({ error: 'Erro ao calcular frete' })
  }
}