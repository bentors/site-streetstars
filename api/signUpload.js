/**
 * Gera uma assinatura temporária para upload direto ao Cloudinary.
 *
 * SEGURANÇA:
 *   - Requer Firebase ID Token válido (usuário autenticado)
 *   - CLOUDINARY_API_SECRET nunca sai do servidor
 *   - A assinatura expira em ~1 minuto (timestamp do Cloudinary)
 */

const crypto = require('crypto')
const { requireAdmin } = require('./_authMiddleware.js')
const { checkRateLimit } = require('./_rateLimiter.js')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') return res.status(204).send('')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Rate limit: 10 uploads/minuto por IP
  if (!checkRateLimit(req, res, { limit: 10, window: 60 })) return

  // ── Autenticação obrigatória (Apenas admins) ──────────────────────────────────────────────
  // Chama required Admin, Qualquer cliente sem a claim admin receberá um 403 Forbidden automaticamente.
  const caller = await requireAdmin(req, res)
  if (!caller) return // requireAdmin já respondeu 401 ou 403

  // ── Credenciais Cloudinary ────────────────────────────────────────────────
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY

  if (!apiSecret || !apiKey) {
    console.error('signUpload: CLOUDINARY_API_SECRET ou CLOUDINARY_API_KEY não definidos')
    return res.status(500).json({ error: 'Configuração de upload indisponível' })
  }

  // ── Geração da assinatura ─────────────────────────────────────────────────
  // O timestamp em segundos limita a validade da assinatura a ~1 minuto
  // no lado do Cloudinary (janela padrão de aceitação).
  const timestamp = Math.round(Date.now() / 1000)

  const signature = crypto
    .createHash('sha256')
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  return res.status(200).json({
    timestamp,
    signature,
    api_key: apiKey,
  })
}