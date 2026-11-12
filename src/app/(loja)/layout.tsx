import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { CartProvider } from '@/features/cart/cart-context'
import { CartDrawer } from '@/features/cart/cart-drawer'
import { getCachedStoreSettings } from '@/server/catalog'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCachedStoreSettings()
  return (
    <CartProvider>
      <SiteHeader />
      <main className="min-h-dvh">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppButton settings={settings} />
      <CartDrawer />
    </CartProvider>
  )
}
