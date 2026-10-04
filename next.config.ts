import type { NextConfig } from 'next'
import { securityHeaders } from './src/lib/security-headers'

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
