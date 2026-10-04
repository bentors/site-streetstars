'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Button, Drawer, Spinner } from '@/components/ui'
import { lineKey, MAX_QTY } from '@/lib/cart'
import { formatBRL } from '@/lib/money'
import type { PricedCart } from '@/server/domain/cart-pricing'
import { priceCartAction } from './actions'
import { useCart } from './cart-context'

export function CartDrawer() {
  const cart = useCart()
  const [priced, setPriced] = useState<PricedCart | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, startTransition] = useTransition()
  const request = useRef(0)
  const { isOpen, lines, removeKeys } = cart

  // Os setState ficam dentro da transição, depois do await (nada síncrono no efeito).
  useEffect(() => {
    if (!isOpen || lines.length === 0) return
    const id = ++request.current
    startTransition(async () => {
      try {
        const result = await priceCartAction(lines)
        if (id !== request.current) return
        setPriced(result)
        setError(null)
        if (result.removedKeys.length > 0) {
          setNotice('Alguns itens não estão mais disponíveis e foram removidos.')
          removeKeys(result.removedKeys)
        }
      } catch {
        if (id === request.current) setError('Não foi possível carregar a sacola. Tente novamente.')
      }
    })
  }, [isOpen, lines, removeKeys])

  const empty = lines.length === 0

  return (
    <Drawer open={isOpen} onClose={cart.close} title="Sua sacola">
      <div className="flex min-h-full flex-col gap-6">
        {notice ? (
          <p
            role="status"
            className="border border-warning/30 bg-warning/10 p-3 text-xs text-warning"
          >
            {notice}
          </p>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-2 border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
          >
            <p>{error}</p>
            {/* Saída para um carrinho que o servidor não consegue precificar (ex.: dado corrompido). */}
            <button
              type="button"
              onClick={() => {
                removeKeys(lines.map(lineKey))
                setError(null)
              }}
              className="self-start underline hover:text-paper"
            >
              Esvaziar sacola
            </button>
          </div>
        ) : null}

        {empty ? (
          <p className="py-10 text-center text-xs tracking-widest text-muted uppercase">
            Sua sacola está vazia.
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {(priced?.lines ?? []).map((line) => (
              <li key={line.key} className="flex gap-4">
                <Link
                  href={`/produto/${line.slug}`}
                  onClick={cart.close}
                  className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-surface"
                >
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase">{line.name}</p>
                    <p className="text-[10px] text-muted uppercase">
                      Tam. {line.size}
                      {line.color ? ` · ${line.color}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${line.name}`}
                        onClick={() => cart.setQty(line.key, line.qty - 1)}
                        className="px-2 py-1 text-muted hover:text-paper"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center font-mono text-xs">{line.qty}</span>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${line.name}`}
                        disabled={line.qty >= MAX_QTY}
                        onClick={() => cart.setQty(line.key, line.qty + 1)}
                        className="px-2 py-1 text-muted hover:text-paper disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-bold">{formatBRL(line.lineTotalCents)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.remove(line.key)}
                    className="self-start text-[10px] tracking-widest text-muted uppercase hover:text-danger"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {loading ? (
          <div className="flex justify-center text-muted">
            <Spinner size="sm" />
          </div>
        ) : null}

        {!empty && priced ? (
          <div className="mt-auto flex flex-col gap-4 border-t border-line pt-6">
            <div className="flex items-center justify-between text-sm tracking-widest uppercase">
              <span className="text-muted">Subtotal</span>
              <span className="text-lg font-bold">{formatBRL(priced.subtotalCents)}</span>
            </div>
            <p className="text-[10px] text-muted">
              Frete e prazo (produção + entrega) calculados no checkout.
            </p>
            <Link
              href="/checkout"
              onClick={cart.close}
              className="flex h-14 items-center justify-center bg-paper text-sm font-black tracking-[0.2em] text-ink uppercase hover:bg-zinc-200"
            >
              Finalizar compra
            </Link>
            <Button variant="ghost" size="sm" onClick={cart.close}>
              Continuar comprando
            </Button>
          </div>
        ) : null}
      </div>
    </Drawer>
  )
}
