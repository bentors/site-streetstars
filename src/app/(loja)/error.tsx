'use client'

import { ErrorScreen } from '@/components/layout/error-screen'

// Erro dentro do segmento: o header, a sacola e a navegação continuam na tela.
export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen reset={reset} />
}
