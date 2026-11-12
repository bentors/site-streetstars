'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { useCart } from '@/features/cart/cart-context'
import type { ProductColor, SizeGuide } from '@/lib/catalog-schemas'
import { cn } from '@/lib/cn'

export type PurchaseProduct = {
  id: string
  name: string
  sizes: string[]
  colors: ProductColor[]
  sizeGuide: SizeGuide | null
}

export function ProductPurchase({
  product,
  onColorChange,
}: {
  product: PurchaseProduct
  onColorChange?: (image: string | null) => void
}) {
  const cart = useCart()
  const [color, setColor] = useState<ProductColor | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)

  const needsColor = product.colors.length > 0 && !color
  const label = needsColor
    ? 'Selecione uma cor'
    : !size
      ? 'Selecione um tamanho'
      : 'Adicionar à sacola'

  return (
    <div className="flex flex-col gap-6 border-t border-line pt-6">
      {product.colors.length > 0 ? (
        <div>
          <p className="mb-3 text-[10px] font-bold tracking-[0.2em] uppercase">
            Cor: <span className="font-normal text-muted">{color?.name ?? 'Selecione'}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((option) => (
              <button
                key={option.name}
                type="button"
                aria-label={`Cor ${option.name}`}
                aria-pressed={color?.name === option.name}
                title={option.name}
                onClick={() => {
                  setColor(option)
                  onColorChange?.(option.image)
                }}
                style={{ backgroundColor: option.hex }}
                className={cn(
                  'size-10 rounded-full border-2',
                  color?.name === option.name
                    ? 'border-paper ring-2 ring-paper ring-offset-2 ring-offset-ink'
                    : 'border-line hover:border-paper',
                )}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex justify-between">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase">Tamanho</p>
          {product.sizeGuide ? (
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="text-[10px] text-muted underline hover:text-paper"
            >
              Guia de medidas
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Tamanho ${option}`}
              aria-pressed={size === option}
              onClick={() => setSize(option)}
              className={cn(
                'flex size-12 items-center justify-center border-2 text-sm font-bold',
                size === option
                  ? 'border-paper bg-paper text-ink'
                  : 'border-line hover:border-paper',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        disabled={needsColor || !size}
        onClick={() => {
          if (!size) return
          cart.add({ productId: product.id, size, color: color?.name ?? null })
        }}
      >
        {label}
      </Button>
      <p className="-mt-3 flex justify-center gap-3 text-[10px] tracking-widest text-paper/40 uppercase">
        <span>Compra segura</span>
        <span aria-hidden="true">•</span>
        <span>Entrega nacional</span>
      </p>

      {product.sizeGuide ? (
        <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Guia de medidas">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] tracking-wider text-muted uppercase">
                  {product.sizeGuide.columns.map((column) => (
                    <th key={column} className="px-3 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {product.sizeGuide.rows.map((row) => (
                  <tr key={row.size} className="border-b border-line/50">
                    <td className="px-3 py-3 font-bold">{row.size}</td>
                    {row.values.map((value, index) => (
                      <td key={index} className="px-3 py-3 font-mono text-paper/70">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-[10px] tracking-widest text-muted uppercase">
            Medidas em centímetros, tolerância de ±2 cm.
          </p>
        </Modal>
      ) : null}
    </div>
  )
}
