const HOST = 'https://res.cloudinary.com/'
const UPLOAD = '/upload/'
const TRANSFORMATION = /^[a-z]{1,3}_[^/,]+(,[a-z]{1,3}_[^/,]+)*$/

export function isCloudinaryUrl(url: string): boolean {
  return url.startsWith(HOST) && url.includes(UPLOAD)
}

function splitUpload(url: string): [string, string[]] {
  const index = url.indexOf(UPLOAD)
  const segments = url.slice(index + UPLOAD.length).split('/')
  // Remove segmentos de transformação do começo, mas nunca o último (o arquivo).
  while (segments.length > 1 && TRANSFORMATION.test(segments[0] ?? '')) segments.shift()
  return [url.slice(0, index), segments]
}

export function cloudinaryUrl(
  url: string,
  {
    width,
    format = 'auto',
    quality = 'auto',
  }: { width?: number; format?: 'auto' | 'jpg'; quality?: 'auto' | number } = {},
): string {
  if (!isCloudinaryUrl(url)) return url
  const [base, segments] = splitUpload(url)
  const transformations = [
    `f_${format}`,
    `q_${quality}`,
    'c_limit',
    ...(width ? [`w_${width}`] : []),
  ]
  return `${base}${UPLOAD}${transformations.join(',')}/${segments.join('/')}`
}

export function cloudinaryPublicId(url: string): string {
  const [, segments] = splitUpload(url)
  if (/^v\d+$/.test(segments[0] ?? '') && segments.length > 1) segments.shift()
  return segments.join('/').replace(/\.[a-z0-9]+$/i, '')
}
