/**
 * servidor local de desenvolvimento
 *
 * ATENÇÃO: este arquivo é usado apenas em `npm run dev:api`.
 *          Em produção (Vercel), cada arquivo em /api é uma Serverless Function
 *          independente — este servidor NÃO é deployado.
 */

require('dotenv').config()

const http = require('http')
const calculateShipping = require('./calculateShipping.js')
const createPayment     = require('./createPayment.js')
const mpWebhook         = require('./mpWebhook.js')
const signUpload        = require('./signUpload.js')

const routes = {
  '/api/calculateShipping': calculateShipping,
  '/api/createPayment':     createPayment,
  '/api/mpWebhook':         mpWebhook,
  '/api/signUpload':        signUpload,
}

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

const server = http.createServer(async (req, res) => {
  // ── CORS local: restrito ao mesmo origin do front-end dev ─────────────────
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  // Inclui Authorization para que os tokens Firebase passem no preflight
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const handler = routes[req.url]
  if (!handler) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', async () => {
    try {
      req.body = body ? JSON.parse(body) : {}
    } catch {
      req.body = {}
    }

    res.status = (code) => { res.statusCode = code; return res }
    res.json   = (data) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    }
    res.send = (data) => res.end(data)

    await handler(req, res)
  })
})

server.listen(3001, () => {
  console.log(`API local → http://localhost:3001  (origin permitido: ${ALLOWED_ORIGIN})`)
})
