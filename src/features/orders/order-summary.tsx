import Image from 'next/image'
import { Spinner } from '@/components/ui'
import { formatBRL } from '@/lib/money'

export type SummaryItem = {
  productId: string
  name: string
  image: string
  size: string
  color: string | null
  qty: number
  lineTotalCents: number
}

export function OrderSummary({
  items,
  subtotalCents,
  discountCents,
  couponCode = null,
  shippingCents,
  loading = false,
}: {
  items: SummaryItem[]
  subtotalCents: number
  discountCents: number
  couponCode?: string | null
  /** null = frete ainda não escolhido. */
  shippingCents: number | null
  loading?: boolean
}) {
  const total = subtotalCents - discountCents + (shippingCents ?? 0)
  return (
    <section aria-label="Resumo do pedido" className="flex flex-col gap-5 border border-line p-6">
      <h2 className="text-sm font-black tracking-widest uppercase italic">Resumo</h2>
      {loading ? (
        <div className="flex justify-center text-muted">
          <Spinner size="sm" />
        </div>
      ) : null}
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={`${item.productId}|${item.size}|${item.color ?? ''}`} className="flex gap-3">
            <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-surface">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-1 justify-between gap-2 text-xs">
              <div>
                <p className="font-bold tracking-widest uppercase">{item.name}</p>
                <p className="text-[10px] text-muted uppercase">
                  Tam. {item.size}
                  {item.color ? ` · ${item.color}` : ''} · Qtd. {item.qty}
                </p>
              </div>
              <p className="font-bold">{formatBRL(item.lineTotalCents)}</p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-line pt-4 text-xs tracking-widest uppercase">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatBRL(subtotalCents)}</dd>
        </div>
        {discountCents > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted">{couponCode ? `Cupom ${couponCode}` : 'Desconto'}</dt>
            <dd>{`− ${formatBRL(discountCents)}`}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted">Frete</dt>
          <dd>{shippingCents === null ? 'A calcular' : formatBRL(shippingCents)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-sm font-bold">
          <dt>Total</dt>
          <dd>{formatBRL(total)}</dd>
        </div>
      </dl>
    </section>
  )
}
