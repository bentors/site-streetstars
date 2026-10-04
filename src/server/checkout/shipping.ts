import 'server-only'
import type { ShippingOption } from '@/lib/checkout'
import { fail, ok, type Result } from '@/lib/result'
import { getStoreSettings } from '@/server/db/settings'
import { cartPackage } from '@/server/domain/shipping-estimate'
import { quoteShipping } from '@/server/integrations/melhorenvio'
import type { CheckoutCart } from './cart'

const UNAVAILABLE = 'Frete indisponível no momento. Tente novamente em instantes.'

export async function shippingOptionsFor(
  cep: string,
  cart: CheckoutCart,
): Promise<Result<ShippingOption[]>> {
  const settings = await getStoreSettings()
  if (!settings.originCep) {
    console.error('Frete: settings/store.originCep está vazio')
    return fail('shipping_unavailable', UNAVAILABLE)
  }

  try {
    const pkg = cartPackage(cart.priced.lines, cart.products)
    const quotes = await quoteShipping({
      fromCep: settings.originCep,
      toCep: cep,
      weightGrams: pkg.weightGrams,
      package: settings.package,
    })
    if (quotes.length === 0) {
      return fail('shipping_unavailable', 'Não encontramos opções de frete para este CEP.')
    }
    return ok(
      quotes.map((quote) => ({
        ...quote,
        productionDays: pkg.productionDays,
        totalDays: pkg.productionDays + quote.deliveryDays,
      })),
    )
  } catch (error) {
    console.error('Frete: falha na cotação', { cep, error })
    return fail('shipping_unavailable', UNAVAILABLE)
  }
}
