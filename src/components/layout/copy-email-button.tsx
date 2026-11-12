'use client'

import { useState } from 'react'

export function CopyEmailButton({ email, className }: { email: string; className: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'E-mail copiado' : `Copiar e-mail ${email}`}
      className={className}
    >
      {copied ? (
        <span className="flex w-5 shrink-0 justify-center text-xs font-bold text-success">✓</span>
      ) : (
        <svg
          className="size-5 shrink-0 text-paper/80 transition-colors group-hover:text-paper"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )}
      <span className="flex flex-col overflow-hidden text-left">
        <span className="text-[10px] tracking-wider text-paper/50 uppercase">E-mail</span>
        <span className="truncate font-mono text-xs font-bold">{copied ? 'Copiado!' : email}</span>
      </span>
    </button>
  )
}
