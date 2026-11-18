import type { NextConfig } from 'next'
import { securityHeaders } from './src/lib/security-headers'

// Preview sem NEXT_PUBLIC_SITE_URL própria usa a URL da branch (retorno do pagamento, links de
// pedido, SEO): as variáveis gerais de Preview valem para todas as branches.
const branchUrl =
  process.env.VERCEL_ENV === 'preview' &&
  !process.env.NEXT_PUBLIC_SITE_URL &&
  process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : undefined

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: branchUrl ? { NEXT_PUBLIC_SITE_URL: branchUrl } : {},
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({ isDev: process.env.NODE_ENV === 'development' }),
      },
    ]
  },
}

export default nextConfig
