'use client'

import { createContext, use, useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'success' | 'error' | 'info'
type ToastInput = { message: string; tone?: Tone }
type ToastItem = { id: number; message: string; tone: Tone }

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

const tones: Record<Tone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-line bg-surface-2 text-paper',
}

export function ToastProvider({
  children,
  duration = 4000,
}: {
  children: React.ReactNode
  duration?: number
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const show = useCallback(
    ({ message, tone = 'info' }: ToastInput) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, message, tone }])
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), duration)
    },
    [duration],
  )

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="region"
        aria-label="Notificações"
        className="fixed right-6 bottom-6 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role="status"
            className={cn(
              'border px-5 py-3 font-mono text-xs tracking-widest uppercase shadow-lg',
              tones[toast.tone],
            )}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const show = use(ToastContext)
  if (!show) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return show
}
