import { cloudinaryUrl } from './cloudinary'

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  return cloudinaryUrl(src, { width, quality: quality ?? 'auto' })
}
