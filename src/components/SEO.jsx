import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, image, url, children }) {
  const siteName = 'Street Stars'
  const defaultDescription = 'Mais do que moda, vestimos estrelas.'
  const defaultImage = 'https://res.cloudinary.com/dmsvju9ca/image/upload/v1770692903/defaulImage_1.jpg'
  const siteUrl = 'https://streetstars.vercel.app'

  const metaTitle = title ? `${title} | ${siteName}` : `${siteName} | Estrelas nascem nas ruas`
  const metaDescription = description || defaultDescription
  const metaImage = image || defaultImage
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl

  return (
    <Helmet>
      {/* Dados Básicos */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={metaUrl} />
      <meta name="theme-color" content="#000000" />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Permite injetar tags extras (como o preload ou schema) vindos da página */}
      {children}
    </Helmet>
  )
}