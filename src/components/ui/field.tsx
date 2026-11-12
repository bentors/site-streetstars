// Sem 'use client': useId funciona em Server Components, e o render prop
// só pode ser passado por quem já está do mesmo lado.
import { useId } from 'react'

export type FieldControlProps = {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string | null
  hint?: string
  children: (control: FieldControlProps) => React.ReactNode
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-[10px] tracking-widest text-muted uppercase">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint ? (
        <p id={hintId} className="text-[10px] text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="font-mono text-[10px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
