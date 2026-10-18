'use server'

import { fail, ok, type Result } from '@/lib/result'
import { requireAdmin } from '@/server/auth/session'
import { uploadSignature, type UploadSignature } from '@/server/integrations/cloudinary'

export async function signUploadAction(): Promise<Result<UploadSignature>> {
  await requireAdmin()
  const signed = uploadSignature()
  return signed
    ? ok(signed)
    : fail('upload_unavailable', 'Upload indisponível: configure o Cloudinary no ambiente.')
}
