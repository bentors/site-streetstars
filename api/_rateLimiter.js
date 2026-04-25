/**
 * Rate limiter em memória para as Serverless Functions do Vercel.
 *
 * COMO USAR:
 *   const { checkRateLimit } = require('./_rateLimiter.js')
 *   const allowed = checkRateLimit(req, res, { limit: 10, window: 60 })
 *   if (!allowed) return
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ limit: number, window: number }} options
 *   limit: máximo de requests permitidos no período
 *   window: duração da janela em segundos
 * @returns {boolean} true se a request pode prosseguir
 */

const store = new Map()

function getClientKey(req) {
  // Vercel injeta o IP real neste header (suporta proxies / CDN)
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown'
  return ip
}

function checkRateLimit(req, res, { limit = 20, window: windowSec = 60 } = {}) {
  const key     = getClientKey(req)
  const now     = Date.now()
  const windowMs = windowSec * 1000

  const record = store.get(key) ?? { count: 0, reset: now + windowMs }

  // Janela expirou → reseta contador
  if (now > record.reset) {
    record.count = 0
    record.reset = now + windowMs
  }

  record.count++
  store.set(key, record)

  // Limpa entradas antigas a cada 500 requests para evitar crescimento indefinido
  if (store.size % 500 === 0) {
    const cutoff = Date.now()
    for (const [k, v] of store.entries()) {
      if (v.reset < cutoff) store.delete(k)
    }
  }

  if (record.count > limit) {
    const retryAfter = Math.ceil((record.reset - now) / 1000)
    res.setHeader('Retry-After', String(retryAfter))
    res.status(429).json({
      error: 'Muitas requisições. Tente novamente em alguns segundos.',
    })
    return false
  }

  return true
}

module.exports = { checkRateLimit }