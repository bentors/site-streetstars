import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/features/auth/sign-in-form'
import { safeNextPath } from '@/lib/safe-next-path'
import { getSessionUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; confirmado?: string | string[] }>
}) {
  const { next, confirmado } = await searchParams
  const nextPath = safeNextPath(typeof next === 'string' ? next : null, '/conta')
  if (await getSessionUser()) redirect(nextPath)

  return (
    <div className="w-full border border-line bg-surface-2/80 p-8 shadow-2xl backdrop-blur-md">
      <h1 className="mb-6 border-b border-line pb-4 text-sm font-bold tracking-widest uppercase">
        Entrar
      </h1>
      {confirmado === '1' ? (
        <p
          role="status"
          className="mb-5 border border-success/30 bg-success/5 p-3 text-xs text-success"
        >
          E-mail confirmado. Entre de novo para ver todos os seus pedidos.
        </p>
      ) : null}
      <SignInForm next={nextPath} />
      <div className="mt-6 flex justify-between text-[10px] tracking-widest text-muted uppercase">
        <Link href="/recuperar-senha" className="hover:text-paper">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-paper underline">
          Criar conta
        </Link>
      </div>
    </div>
  )
}
