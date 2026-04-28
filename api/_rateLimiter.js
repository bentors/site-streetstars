/**
 * Rate limiter distribuído usando Upstash Redis.
 * Funciona corretamente em ambiente serverless (Vercel) — o estado
 * persiste entre instâncias porque fica no Redis, não em memória.
 *
 * COMO USAR:
 *   const { checkRateLimit } = require('./_rateLimiter.js')
 *   const allowed = await checkRateLimit(req, res, { limit: 10, window: 60 })
 *   if (!allowed) return
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ limit: number, window: number }} options
 *   limit: máximo de requests permitidos no período
 *   window: duração da janela em segundos
 * @returns {Promise<boolean>} true se a request pode prosseguir
 */

const { Ratelimit } = require('@upstash/ratelimit')
const { Redis } = require('@upstash/redis')

let redis

function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

function getClientKey(req) {
  // Vercel injeta o IP real neste header (suporta proxies / CDN)
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown'
  return ip
}

async function checkRateLimit(req, res, { limit = 20, window: windowSec = 60 } = {}) {
  // Fallback seguro: libera em dev local se Redis não estiver configurado
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV !== 'production') return true
    // Em produção sem as vars configuradas, bloqueia por segurança
    res.status(503).json({ error: 'Rate limiter não configurado.' })
    return false
  }

  try {
    const ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: 'rl:streetstars',
    })

    const ip = getClientKey(req)
    const { success, reset } = await ratelimit.limit(ip)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      res.status(429).json({
        error: 'Muitas requisições. Tente novamente em alguns segundos.',
      })
      return false
    }

    return true
  } catch (err) {
    // Se o Redis falhar por qualquer motivo, loga mas não derruba o endpoint
    console.error('Rate limiter erro:', err.message)
    return true
  }
}

module.exports = { checkRateLimit }