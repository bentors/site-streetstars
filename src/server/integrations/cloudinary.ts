import 'server-only'
import { createHash } from 'node:crypto'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/server/env'

export const UPLOAD_FOLDER = 'streetstars'

/** Assinatura do Cloudinary: parâmetros em ordem alfabética, `k=v` unidos por `&`, + segredo, SHA-1. */
export function signParams(params: Record<string, string | number>, secret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1')
    .update(payload + secret)
    .digest('hex')
}

export type UploadSignature = {
  cloudName: string
  apiKey: string
  folder: string
  timestamp: number
  signature: string
}

/** Upload direto do navegador: o segredo fica aqui, só a assinatura (válida por 1 h) sai. */
export function uploadSignature(now = new Date()): UploadSignature | null {
  const { CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret } = serverEnv()
  const cloudName = publicEnv().NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!apiKey || !secret || !cloudName) return null
  const timestamp = Math.floor(now.getTime() / 1000)
  return {
    cloudName,
    apiKey,
    folder: UPLOAD_FOLDER,
    timestamp,
    signature: signParams({ folder: UPLOAD_FOLDER, timestamp }, secret),
  }
}
