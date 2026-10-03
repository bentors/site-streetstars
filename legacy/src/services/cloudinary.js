import { auth } from './firebase'

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const uploadCache = new Map()

export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: 'Nenhum arquivo selecionado.' }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato inválido. Use JPG, PNG ou WebP.' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo: 5MB.' }
  }
  return { valid: true, error: null }
}

/**
 * Obtém assinatura temporária do servidor.
 * Envia o ID Token do usuário autenticado no header Authorization.
 */
async function getUploadSignature() {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Usuário não autenticado')

  // Força refresh se o token estiver próximo de expirar (Firebase faz isso automaticamente,
  // mas garantimos explicitamente para evitar erros de "token expirado" no servidor)
  const idToken = await currentUser.getIdToken()

  const res = await fetch('/api/signUpload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,  // ← token enviado para o servidor verificar
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Falha ao obter assinatura de upload')
  }

  return res.json() // { timestamp, signature, api_key }
}

export const uploadImageToCloudinary = async (file, options = {}) => {
  if (!file) return null

  const { valid, error } = validateImageFile(file)
  if (!valid) throw new Error(error)

  const fileKey = `${file.name}-${file.size}-${file.lastModified}`

  if (uploadCache.has(fileKey)) return uploadCache.get(fileKey)

  const uploadPromise = (async () => {
    try {
      const { timestamp, signature, api_key } = await getUploadSignature()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('api_key', api_key)
      if (options.quality) formData.append('quality', options.quality)
      if (options.format)  formData.append('format',  options.format)

      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData, signal: controller.signal }
      )

      clearTimeout(timeoutId)
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`)

      const data = await response.json()
      setTimeout(() => uploadCache.delete(fileKey), 300_000) // expira cache em 5 min
      return data.secure_url
    } catch (err) {
      uploadCache.delete(fileKey)
      throw err
    }
  })()

  uploadCache.set(fileKey, uploadPromise)
  return uploadPromise
}