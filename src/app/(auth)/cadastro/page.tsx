import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/features/auth/sign-up-form'
import { getSessionUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Criar conta', robots: { index: false } }

export default async function SignUpPage() {
  if (await getSessionUser()) redirect('/conta')
  return (
    <div className="w-full border border-line bg-surface-2/80 p-8 shadow-2xl backdrop-blur-md">
      <h1 className="mb-6 border-b border-line pb-4 text-sm font-bold tracking-widest uppercase">
        Criar conta
      </h1>
      <SignUpForm />
      <p className="mt-6 text-center text-[10px] tracking-widest text-muted uppercase">
        Já tem conta?{' '}
        <Link href="/entrar" className="text-paper underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
