import type { Metadata } from 'next'
import Link from 'next/link'
import { PasswordResetForm } from '@/features/auth/password-reset-form'

export const metadata: Metadata = { title: 'Recuperar senha', robots: { index: false } }

export default function PasswordResetPage() {
  return (
    <div className="w-full border border-line bg-surface-2/80 p-8 shadow-2xl backdrop-blur-md">
      <h1 className="mb-6 border-b border-line pb-4 text-sm font-bold tracking-widest uppercase">
        Recuperar senha
      </h1>
      <PasswordResetForm />
      <p className="mt-6 text-center text-[10px] tracking-widest text-muted uppercase">
        <Link href="/entrar" className="text-paper underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
