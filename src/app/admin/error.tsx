'use client'

import { ErrorScreen } from '@/components/layout/error-screen'

// Erro dentro do painel: o cabeçalho e as abas continuam na tela.
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen reset={reset} />
}
