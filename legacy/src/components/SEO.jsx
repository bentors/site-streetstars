import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, image, url, ogType = 'website', children }) {
  const siteName = 'Street Stars'
  const defaultDescription = 'Mais do que moda, vestimos estrelas.'
  const defaultImage = 'https://res.cloudinary.com/dmsvju9ca/image/upload/v1770692903/defaulImage_1.jpg'
  const siteUrl = 'https://streetstars.vercel.app'

  const getSocialImage = (imgUrl) => {
    if (!imgUrl) return defaultImage
    let finalUrl = imgUrl || defaultImage
    if (!finalUrl.includes('cloudinary.com')) return finalUrl
    if (finalUrl.includes('/upload/')) {
      if (finalUrl.includes('f_auto') || finalUrl.includes('q_auto')) {
        finalUrl = finalUrl.replace(/f_auto,?/, 'f_jpg,').replace(/q_auto,?/, 'w_1200,')
      } else if (!finalUrl.includes('/f_')) {
        finalUrl = finalUrl.replace('/upload/', '/upload/f_jpg,w_1200/')
      }
    }
    return finalUrl.replace(',/', '/')
  }

  const metaTitle = title ? `${title} | ${siteName}` : `${siteName} | Estrelas nascem nas ruas`
  const metaDescription = description || defaultDescription
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl
  const metaImage = getSocialImage(image)

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={metaUrl} />
      <meta name="theme-color" content="#000000" />

      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={metaTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {children}
    </Helmet>
  )
}