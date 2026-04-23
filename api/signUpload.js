const crypto = require('crypto')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY

  if (!apiSecret || !apiKey) {
    console.error('signUpload: CLOUDINARY_API_SECRET ou CLOUDINARY_API_KEY não definidos')
    return res.status(500).json({ error: 'Configuração de upload indisponível' })
  }

  const timestamp = Math.round(Date.now() / 1000)

  // Assina apenas timestamp — sem upload_preset (signed upload não usa preset)
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