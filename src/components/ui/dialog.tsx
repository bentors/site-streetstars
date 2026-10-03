'use client'

import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/cn'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

const placements = {
  center: 'm-auto w-[min(100%-2rem,32rem)]',
  right: 'ml-auto mr-0 my-0 h-dvh max-h-dvh w-full max-w-md',
} as const

function BaseDialog({
  open,
  onClose,
  title,
  children,
  className,
  placement,
}: DialogProps & { placement: keyof typeof placements }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clique no backdrop: o alvo é o próprio <dialog>, não o conteúdo.
        if (event.target === event.currentTarget) onClose()
      }}
      className={cn(
        'border border-line bg-surface-2 p-0 text-paper backdrop:bg-black/80 backdrop:backdrop-blur-sm',
        placements[placement],
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-line p-6">
          <h2 id={titleId} className="text-sm font-black tracking-widest uppercase">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-muted transition-colors hover:text-paper"
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </dialog>
  )
}

export function Modal(props: DialogProps) {
  return <BaseDialog {...props} placement="center" />
}

export function Drawer(props: DialogProps) {
  return <BaseDialog {...props} placement="right" />
}
