'use client'

import { useState } from 'react'
import { Button } from './button'

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // Sem permissão de área de transferência: o texto continua visível para copiar à mão.
        }
      }}
    >
      {copied ? 'Copiado!' : label}
    </Button>
  )
}
