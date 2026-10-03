'use client'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">Algo deu errado</h1>
      <p className="text-muted text-sm">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="bg-paper text-ink px-6 py-3 text-xs font-black tracking-[0.2em] uppercase"
      >
        Tentar de novo
      </button>
    </main>
  )
}
