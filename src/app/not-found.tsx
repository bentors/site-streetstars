import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-widest uppercase">
        Essa estrela se perdeu no caminho
      </h1>
      <Link href="/" className="text-muted hover:text-paper text-xs tracking-[0.2em] uppercase">
        Voltar para a home
      </Link>
    </main>
  )
}
