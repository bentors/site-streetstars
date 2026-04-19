const axios = require('axios')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body)
    } catch {
      req.body = {}
    }
  }

  const { cep } = req.body || {}

  if (!cep || cep.replace(/\D/g, '').length !== 8) {
    return res.status(400).json({ error: 'CEP inválido' })
  }

  try {
    const response = await axios.get(
      'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHORENVIO_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'StreetStars/1.0 (streetstarsco@gmail.com)',
        },
        params: {
          from: { postal_code: process.env.MELHORENVIO_ORIGEM_CEP },
          to: { postal_code: cep.replace(/\D/g, '') },
          package: {
            height: 5,
            width: 30,
            length: 30,
            weight: 0.5,
          },
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