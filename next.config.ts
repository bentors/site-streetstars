import type { NextConfig } from 'next'
import { securityHeaders } from './src/lib/security-headers'

// Cada preview usa a própria URL (retorno do pagamento, links de pedido, SEO), já que as
// variáveis de Preview são as mesmas para todas as branches.
const branchUrl =
  process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL
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
