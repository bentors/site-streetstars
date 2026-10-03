'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-black uppercase italic tracking-tighter">Algo deu errado</h1>
      <p className="text-sm text-muted">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="bg-paper px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-ink"
      >
        Tentar de novo
      </button>
    </main>
  )
}
