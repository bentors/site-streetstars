import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-bold uppercase tracking-widest">Essa estrela se perdeu no caminho</h1>
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-paper">
        Voltar para a home
      </Link>
    </main>
  )
}
