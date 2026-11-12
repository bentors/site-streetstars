import type { ProductImage } from '@/lib/catalog-schemas'
import { signUploadAction } from './upload-actions'

const FAILED = 'Não foi possível enviar a foto. Tente de novo.'

/** Upload direto para o Cloudinary com assinatura do servidor (o segredo não vem ao navegador). */
export async function uploadImage(file: File): Promise<ProductImage> {
  const signed = await signUploadAction()
  if (!signed.ok) throw new Error(signed.message)
  const { cloudName, apiKey, folder, timestamp, signature } = signed.data
  const body = new FormData()
  body.append('file', file)
  body.append('api_key', apiKey)
  body.append('timestamp', String(timestamp))
  body.append('folder', folder)
  body.append('signature', signature)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  })
  if (!response.ok) throw new Error(FAILED)
  const json = (await response.json()) as { secure_url?: string; public_id?: string }
  if (!json.secure_url || !json.public_id) throw new Error(FAILED)
  return { url: json.secure_url, publicId: json.public_id, alt: '' }
}
