import 'server-only'

type ShippingProduct = { id: string; weightGrams: number; productionDays: number }

/** Um pacote só (medidas fixas de settings/store.package), com o peso somado do carrinho. */
export function cartPackage(
  lines: { productId: string; qty: number }[],
  products: ShippingProduct[],
): { weightGrams: number; productionDays: number } {
  const byId = new Map(products.map((product) => [product.id, product]))
  let weightGrams = 0
  let productionDays = 0
  for (const line of lines) {
    const product = byId.get(line.productId)
    if (!product) throw new Error(`Produto sem dados de frete: ${line.productId}`)
    weightGrams += product.weightGrams * line.qty
    productionDays = Math.max(productionDays, product.productionDays)
  }
  return { weightGrams, productionDays }
}
