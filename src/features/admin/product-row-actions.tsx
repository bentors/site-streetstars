'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Input } from '@/components/ui'
import { setProductFeaturedAction, setProductStatusAction } from './catalog-actions'
import { attempt } from '@/lib/attempt'
import type { Result } from '@/lib/result'

type Status = 'draft' | 'active' | 'archived'

export function ProductRowActions({
  id,
  status,
  featured,
  featuredOrder,
  nextFeaturedOrder,
}: {
  id: string
  status: Status
  featured: boolean
  featuredOrder: number | null
  /** Próxima posição livre nos destaques (maior ordem + 1). */
  nextFeaturedOrder: number
}) {
  const router = useRouter()
  const [order, setOrder] = useState(String(featuredOrder ?? 1))
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function run(action: () => Promise<Result<null>>) {
    setMessage(null)
    start(async () => {
      const result = await attempt(action)
      if (!result.ok) setMessage(result.message ?? 'Algo deu errado.')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'active' ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => setProductStatusAction(id, 'active'))}
        >
          Ativar
        </Button>
      ) : null}
      {status !== 'archived' ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => setProductStatusAction(id, 'archived'))}
        >
          Arquivar
        </Button>
      ) : null}
      {featured ? (
        <>
          <Input
            aria-label="Ordem do destaque"
            inputMode="numeric"
            className="w-16 p-1"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            onBlur={() => {
              const value = Number.parseInt(order, 10)
              if (!Number.isSafeInteger(value) || value < 1) {
                setMessage('Ordem inválida')
                return
              }
              // Só grava se mudou: cada gravação invalida o cache da vitrine inteira.
              if (value !== featuredOrder) run(() => setProductFeaturedAction(id, true, value))
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => setProductFeaturedAction(id, false, null))}
          >
            Tirar destaque
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => setProductFeaturedAction(id, true, nextFeaturedOrder))}
        >
          Destacar
        </Button>
      )}
      {message ? <span className="text-[10px] text-danger">{message}</span> : null}
    </div>
  )
}
