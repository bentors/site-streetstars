require('dotenv').config()

const http = require('http')
const calculateShipping = require('./calculateShipping.js')
const createPayment = require('./createPayment.js')
const mpWebhook = require('./mpWebhook.js')

const routes = {
  '/api/calculateShipping': calculateShipping,
  '/api/createPayment': createPayment,
  '/api/mpWebhook': mpWebhook,
}

const server = http.createServer(async (req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

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
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    }
    res.send = (data) => res.end(data)

    await handler(req, res)
  })
})

server.listen(3001, () => {
  console.log('API local rodando em http://localhost:3001')
})