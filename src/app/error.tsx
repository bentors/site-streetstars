'use client'

import { ErrorScreen } from '@/components/layout/error-screen'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-dvh">
      <ErrorScreen reset={reset} />
    </main>
  )
}
