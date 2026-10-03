/**
 * Verifica o Firebase ID Token enviado pelo cliente no header Authorization.
 * Uso: const { uid, email } = await requireAuth(req, res)
 *      if (!uid) return  // já respondeu 401
 */

const admin = require('./_firebase.js')

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {Promise<{ uid: string, email: string } | null>}
 *   Retorna { uid, email } se autenticado; null se respondeu 401.
 */
async function requireAuth(req, res) {
  const authHeader = req.headers['authorization'] || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!idToken) {
    res.status(401).json({ error: 'Autenticação obrigatória' })
    return null
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    return { uid: decoded.uid, email: decoded.email || '' }
  } catch (err) {
    console.warn('requireAuth: token inválido ou expirado —', err.code)
    res.status(401).json({ error: 'Token inválido ou expirado' })
    return null
  }
}

/**
 * Verifica que o usuário autenticado tem a custom claim `admin === true`.
 */
async function requireAdmin(req, res) {
  const authHeader = req.headers['authorization'] || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!idToken) {
    res.status(401).json({ error: 'Autenticação obrigatória' })
    return null
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    if (decoded.admin !== true) {
      res.status(403).json({ error: 'Acesso restrito a administradores' })
      return null
    }
    return { uid: decoded.uid, email: decoded.email || '' }
  } catch (err) {
    console.warn('requireAdmin: token inválido —', err.code)
    res.status(401).json({ error: 'Token inválido ou expirado' })
    return null
  }
}

module.exports = { requireAuth, requireAdmin }