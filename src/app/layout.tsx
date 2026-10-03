import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { publicEnv } from '@/lib/env'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv().NEXT_PUBLIC_SITE_URL),
  title: { default: 'Street Stars | Estrelas nascem nas ruas', template: '%s | Street Stars' },
  description: 'Streetwear autêntico nascido em São Paulo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-ink text-paper min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
