'use client'

export function ErrorScreen({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">Algo deu errado</h1>
      <p className="text-sm text-muted">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="bg-paper px-6 py-3 text-xs font-black tracking-[0.2em] text-ink uppercase"
      >
        Tentar de novo
      </button>
    </div>
  )
}
