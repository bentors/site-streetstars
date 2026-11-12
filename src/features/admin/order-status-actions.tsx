'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, TextField } from '@/components/ui'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/order-status'
import {
  resendShippedEmailAction,
  transitionOrderAction,
  updateTrackingAction,
} from './order-actions'
import { attempt } from '@/lib/attempt'

const NEEDS_NOTE: OrderStatus[] = ['cancelled', 'refunded']

export function OrderStatusActions({
  orderId,
  targets,
  shippedEmailPending,
  canEditTracking,
}: {
  orderId: string
  targets: OrderStatus[]
  shippedEmailPending: boolean
  /** Pedido enviado ou entregue: o código digitado errado pode ser corrigido. */
  canEditTracking: boolean
}) {
  const router = useRouter()
  const [chosen, setChosen] = useState<OrderStatus | null>(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [note, setNote] = useState('')
  const [editingTracking, setEditingTracking] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  function confirm() {
    if (!chosen) return
    setMessage(null)
    const input = chosen === 'shipped' ? { to: chosen, trackingCode, note } : { to: chosen, note }
    start(async () => {
      const result = await attempt(() => transitionOrderAction(orderId, input))
      if (!result.ok) {
        setMessage({ ok: false, text: result.message })
        return
      }
      // Limpa para a próxima transição não herdar a observação nem o código desta.
      setChosen(null)
      setNote('')
      setTrackingCode('')
      setMessage(
        result.data.emailSent
          ? { ok: true, text: 'Status atualizado.' }
          : {
              ok: false,
              text: 'Status atualizado, mas o e-mail ao cliente não saiu. Use "Reenviar e-mail de envio".',
            },
      )
      router.refresh()
    })
  }

  function saveTracking() {
    setMessage(null)
    start(async () => {
      const result = await attempt(() => updateTrackingAction(orderId, newCode))
      if (!result.ok) {
        setMessage({ ok: false, text: result.message })
        return
      }
      setEditingTracking(false)
      setNewCode('')
      setMessage(
        result.data.emailSent
          ? { ok: true, text: 'Rastreio corrigido e e-mail reenviado.' }
          : {
              ok: false,
              text: 'Rastreio corrigido, mas o e-mail ao cliente não saiu. Use "Reenviar e-mail de envio".',
            },
      )
      router.refresh()
    })
  }

  function resend() {
    setMessage(null)
    start(async () => {
      const result = await attempt(() => resendShippedEmailAction(orderId))
      setMessage(
        result.ok ? { ok: true, text: 'E-mail enviado.' } : { ok: false, text: result.message },
      )
      if (result.ok) router.refresh()
    })
  }

  return (
    <section className="flex flex-col gap-4 border border-line p-5">
      <h2 className="text-xs font-black tracking-widest uppercase">Ações</h2>
      {targets.length === 0 ? (
        <p className="text-xs text-muted">Nenhuma ação disponível para este status.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {targets.map((target) => (
            <Button
              key={target}
              variant={NEEDS_NOTE.includes(target) ? 'danger' : 'secondary'}
              size="sm"
              disabled={pending}
              onClick={() => setChosen(target)}
            >
              Marcar como {ORDER_STATUS_LABELS[target]}
            </Button>
          ))}
        </div>
      )}
      {chosen ? (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          {chosen === 'shipped' ? (
            <TextField label="Código de rastreio" value={trackingCode} onValue={setTrackingCode} />
          ) : null}
          <TextField
            label={
              NEEDS_NOTE.includes(chosen) ? 'Observação (obrigatória)' : 'Observação (opcional)'
            }
            value={note}
            onValue={setNote}
          />
          <div className="flex gap-2">
            <Button size="sm" loading={pending} onClick={confirm}>
              Confirmar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setChosen(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
      {canEditTracking ? (
        editingTracking ? (
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <TextField label="Novo código de rastreio" value={newCode} onValue={setNewCode} />
            <div className="flex gap-2">
              <Button size="sm" loading={pending} onClick={saveTracking}>
                Salvar rastreio
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingTracking(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            disabled={pending}
            onClick={() => setEditingTracking(true)}
          >
            Corrigir rastreio
          </Button>
        )
      ) : null}
      {shippedEmailPending ? (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          loading={pending}
          onClick={resend}
        >
          Reenviar e-mail de envio
        </Button>
      ) : null}
      {message ? (
        <p role="status" className={message.ok ? 'text-xs text-success' : 'text-xs text-danger'}>
          {message.text}
        </p>
      ) : null}
    </section>
  )
}
